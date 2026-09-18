import prisma from "@/lib/prisma";
import type { Permission } from "@/lib/permissions";

export interface RoleListItem {
  id: string;
  name: string;
  description: string | null;
  permissions: Permission[];
  userCount: number;
  isSystem: boolean; // Administrator is protected
}

const SYSTEM_ROLE = "Administrator";

/** All roles with their permissions and how many users have each. */
export async function listRoles(): Promise<RoleListItem[]> {
  const roles = await prisma.role.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      permissions: { include: { permission: true } },
      _count: { select: { users: true } },
    },
  });

  return roles.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    permissions: r.permissions.map((rp) => rp.permission.key as Permission),
    userCount: r._count.users,
    isSystem: r.name === SYSTEM_ROLE,
  }));
}

export async function getRole(id: string): Promise<RoleListItem | null> {
  const r = await prisma.role.findUnique({
    where: { id },
    include: {
      permissions: { include: { permission: true } },
      _count: { select: { users: true } },
    },
  });
  if (!r) return null;
  return {
    id: r.id,
    name: r.name,
    description: r.description,
    permissions: r.permissions.map((rp) => rp.permission.key as Permission),
    userCount: r._count.users,
    isSystem: r.name === SYSTEM_ROLE,
  };
}

export { SYSTEM_ROLE };
