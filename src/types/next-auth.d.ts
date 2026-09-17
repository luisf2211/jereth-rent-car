import type { Permission } from "@/lib/permissions";
import type { DefaultSession } from "next-auth";

/**
 * Extend Auth.js session/JWT with our domain fields (id, role, permissions)
 * so server code can authorize without extra DB lookups.
 */
declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      roleName: string;
      permissions: Permission[];
    } & DefaultSession["user"];
  }

  interface User {
    roleName: string;
    permissions: Permission[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    roleName: string;
    permissions: Permission[];
  }
}
