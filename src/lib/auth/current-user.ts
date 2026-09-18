import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import type { AuthUser, Permission } from "@/lib/permissions";

/**
 * Resolves the current authenticated user, reading role + permissions FRESH
 * from the database by the session user id. This means changes to a role's
 * permissions take effect immediately (no re-login needed). Also treats a
 * now-inactive user as logged out.
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return null;

  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      role: { include: { permissions: { include: { permission: true } } } },
    },
  });

  if (!user || !user.isActive) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    roleName: user.role.name,
    permissions: user.role.permissions.map((rp) => rp.permission.key as Permission),
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
