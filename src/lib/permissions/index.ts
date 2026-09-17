/**
 * Minimal RBAC scaffold.
 *
 * Phase 1: types + a pure `hasPermission` helper. There is no auth wired yet,
 * so this is not enforced on real requests, but admin actions should be gated
 * through this helper (both in UI and server-side) once Auth.js is added.
 */

export const PERMISSIONS = [
  "users.view",
  "users.create",
  "users.edit",
  "users.disable",
  "roles.view",
  "roles.manage",
  "branding.view",
  "branding.edit",
  "vehicles.view",
  "vehicles.create",
  "vehicles.edit",
  "vehicles.disable",
] as const;

export type Permission = (typeof PERMISSIONS)[number];

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  permissions: Permission[];
}

/**
 * Returns true when the user has the given permission.
 * Server-side callers must use this to guard mutations; do NOT rely on
 * hiding UI alone.
 */
export function hasPermission(
  user: Pick<AuthUser, "permissions"> | null | undefined,
  permission: Permission
): boolean {
  if (!user) return false;
  return user.permissions.includes(permission);
}
