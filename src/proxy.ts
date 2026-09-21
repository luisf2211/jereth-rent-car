import { NextResponse } from "next/server";
import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

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

  return NextResponse.next();
});

export const config = {
  // Run site-wide (except static assets/api) so the host redirect applies
  // everywhere, plus the protected routes for the auth guard.
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)", "/admin/:path*", "/login"],
};
