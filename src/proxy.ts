import { NextResponse, type NextRequest } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";
import {
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  resolveLocaleFromAcceptLanguage,
} from "@/i18n/config";

/**
 * On first visit, stamp the NEXT_LOCALE cookie from the browser's
 * Accept-Language so server components render in the right language. A manual
 * ES/EN selection in the header overwrites this cookie and wins from then on,
 * so we never override an existing cookie here.
 */
function ensureLocaleCookie(req: NextRequest, res: NextResponse) {
  if (req.cookies.get(LOCALE_COOKIE)) return; // already set / manual choice — leave it.
  const locale = resolveLocaleFromAcceptLanguage(req.headers.get("accept-language"));
  res.cookies.set(LOCALE_COOKIE, locale, {
    path: "/",
    maxAge: LOCALE_COOKIE_MAX_AGE,
    sameSite: "lax",
  });
}

/**
 * Route protection + canonical host redirect (Next.js 16 "proxy" convention,
 * formerly "middleware").
 *
 * 1) Canonical host: redirect the apex `jerethrentcar.com` to
 *    `www.jerethrentcar.com` (308) so there is a single canonical host.
 * 2) Auth guard: block /admin/* for anonymous users (redirect to /login) and
 *    bounce logged-in users away from /login.
 *
 * We wrap NextAuth's `auth` so `req.auth` is populated, then enforce both
 * rules ourselves — returning our own response, so we must replicate the
 * guard here (returning NextResponse.next() bypasses the authorized callback).
 */
const { auth } = NextAuth(authConfig);

const APEX_HOST = "jerethrentcar.com";
const CANONICAL_HOST = "www.jerethrentcar.com";

export default auth((req) => {
  const { nextUrl } = req;
  const host = req.headers.get("host")?.toLowerCase();

  // 1) Canonical host redirect: apex -> www, preserving path + query.
  if (host === APEX_HOST) {
    const url = nextUrl.clone();
    url.host = CANONICAL_HOST;
    url.protocol = "https:";
    url.port = "";
    return NextResponse.redirect(url, 308);
  }

  // 2) Auth guard.
  const isLoggedIn = Boolean(req.auth?.user);
  const path = nextUrl.pathname;

  if (path.startsWith("/admin") && !isLoggedIn) {
    const loginUrl = nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  if (path === "/login" && isLoggedIn) {
    const adminUrl = nextUrl.clone();
    adminUrl.pathname = "/admin";
    return NextResponse.redirect(adminUrl);
  }

  // Normal pass-through: make sure the locale cookie exists for the public site.
  const res = NextResponse.next();
  ensureLocaleCookie(req, res);
  return res;
});

export const config = {
  // Run site-wide (except static assets/api) so the host redirect applies
  // everywhere, plus the protected routes for the auth guard.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)", "/admin/:path*", "/login"],
};
