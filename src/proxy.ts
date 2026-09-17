import NextAuth from "next-auth";
import { authConfig } from "@/auth.config";

/**
 * Route protection (Next.js 16 "proxy" convention, formerly "middleware").
 * Uses the edge-safe auth config's `authorized` callback to guard /admin/*
 * and redirect logged-in users away from /login.
 */
const { auth } = NextAuth(authConfig);

export default auth;

export const config = {
  matcher: ["/admin/:path*", "/login"],
};
