import type { NextAuthConfig, Session } from "next-auth";

/**
 * Edge-safe Auth.js config (no Prisma, no bcrypt).
 *
 * This is the part imported by the middleware. The Credentials provider and
 * DB access live in auth.ts (Node runtime). Keeping them split avoids running
 * bcrypt/Prisma in the Edge runtime.
 */
export const authConfig = {
  trustHost: true,
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
  providers: [], // real providers added in auth.ts
  callbacks: {
    /**
     * Route protection used by the middleware. Blocks /admin/* for
     * unauthenticated users; Auth.js redirects them to the signIn page.
     */
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = Boolean(auth?.user);
      const isAdminArea = nextUrl.pathname.startsWith("/admin");

      if (isAdminArea) return isLoggedIn;

      // Already logged in and visiting /login -> send to dashboard.
      if (nextUrl.pathname === "/login" && isLoggedIn) {
        return Response.redirect(new URL("/admin", nextUrl));
      }
      return true;
    },
    jwt({ token, user }) {
      // On sign-in, persist domain fields into the token.
      if (user) {
        token.id = user.id as string;
        token.roleName = user.roleName;
        token.permissions = user.permissions;
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.roleName = token.roleName as string;
        session.user.permissions = token.permissions as Session["user"]["permissions"];
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
