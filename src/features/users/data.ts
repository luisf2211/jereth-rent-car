import prisma from "@/lib/prisma";
import type { RoleOption, UserListItem } from "./types";

/** Lists all users with their role name. Excludes passwordHash. */
export async function listUsers(): Promise<UserListItem[]> {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: { role: { select: { name: true } } },
  });

  return users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    isActive: u.isActive,
    roleId: u.roleId,
    roleName: u.role.name,
    createdAt: u.createdAt.toISOString(),
  }));
}

/** Single user for the edit form. Excludes passwordHash. */
export async function getUser(id: string): Promise<UserListItem | null> {
  const u = await prisma.user.findUnique({
    where: { id },
    include: { role: { select: { name: true } } },
  });
  if (!u) return null;

  return {
    id: u.id,
    name: u.name,
    email: u.email,
    isActive: u.isActive,
    roleId: u.roleId,
    roleName: u.role.name,
    createdAt: u.createdAt.toISOString(),
  };
}

export async function countUsers(): Promise<number> {
  return prisma.user.count();
}

/** Roles for the select input. */
export async function listRoleOptions(): Promise<RoleOption[]> {
  const roles = await prisma.role.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true },
  });
  return roles;
}
