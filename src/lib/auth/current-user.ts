import { auth } from "@/auth";
import type { AuthUser, Permission } from "@/lib/permissions";

/**
 * Resolves the current authenticated user from the Auth.js session.
 * Permissions come from the JWT, populated at sign-in from the user's role.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const session = await auth();
  if (!session?.user) return null;

  return {
    id: session.user.id,
    name: session.user.name ?? "",
    email: session.user.email ?? "",
    permissions: session.user.permissions ?? [],
  };
}

/**
 * Throws if the current user lacks the permission. Use at the top of every
 * mutating server action so authorization is enforced server-side, not just
 * by hiding UI.
 */
export async function requirePermission(permission: Permission): Promise<AuthUser> {
  const user = await getCurrentUser();
  if (!user || !user.permissions.includes(permission)) {
    throw new Error("No autorizado");
  }
  return user;
}
