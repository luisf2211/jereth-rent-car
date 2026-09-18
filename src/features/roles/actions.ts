"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/current-user";
import { roleSchema } from "@/lib/validations/role";
import type { ActionResult } from "@/lib/actions/result";
import { SYSTEM_ROLE } from "./data";

function fieldErrorsFrom(error: z.ZodError): Record<string, string> {
  const flat = z.flattenError(error).fieldErrors as Record<string, string[] | undefined>;
  const out: Record<string, string> = {};
  for (const [key, msgs] of Object.entries(flat)) {
    if (msgs && msgs.length) out[key] = msgs[0]!;
  }
  return out;
}

/**
 * Replaces a role's permission set with the given permission keys.
 * Resolves keys to Permission ids and rewrites the join rows in a transaction.
 */
async function setRolePermissions(roleId: string, keys: string[]) {
  const perms = keys.length
    ? await prisma.permission.findMany({ where: { key: { in: keys } }, select: { id: true } })
    : [];
  await prisma.$transaction([
    prisma.rolePermission.deleteMany({ where: { roleId } }),
    ...(perms.length
      ? [
          prisma.rolePermission.createMany({
            data: perms.map((p) => ({ roleId, permissionId: p.id })),
          }),
        ]
      : []),
  ]);
}

export async function createRole(input: unknown): Promise<ActionResult> {
  try {
    await requirePermission("roles.manage");
  } catch {
    return { ok: false, message: "No tienes permiso para gestionar roles." };
  }

  const parsed = roleSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Revisa los campos.", fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  const { name, description, permissions } = parsed.data;
  try {
    const role = await prisma.role.create({
      data: { name, description: description || null },
    });
    await setRolePermissions(role.id, permissions);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false, message: "Ya existe un rol con ese nombre.", fieldErrors: { name: "Nombre en uso" } };
    }
    console.error("createRole failed:", error);
    return { ok: false, message: "No se pudo crear el rol." };
  }

  revalidatePath("/admin/roles");
  return { ok: true, message: "Rol creado." };
}

export async function updateRole(id: string, input: unknown): Promise<ActionResult> {
  try {
    await requirePermission("roles.manage");
  } catch {
    return { ok: false, message: "No tienes permiso para gestionar roles." };
  }

  const parsed = roleSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Revisa los campos.", fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  const existing = await prisma.role.findUnique({ where: { id } });
  if (!existing) return { ok: false, message: "El rol no existe." };

  const { name, description, permissions } = parsed.data;

  // The Administrator role keeps all permissions and its name (safety net so
  // no one can lock everyone out of the backoffice).
  const isSystem = existing.name === SYSTEM_ROLE;

  try {
    await prisma.role.update({
      where: { id },
      data: {
        name: isSystem ? existing.name : name,
        description: description || null,
      },
    });
    if (!isSystem) {
      await setRolePermissions(id, permissions);
    }
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false, message: "Ya existe un rol con ese nombre.", fieldErrors: { name: "Nombre en uso" } };
    }
    console.error("updateRole failed:", error);
    return { ok: false, message: "No se pudo actualizar el rol." };
  }

  revalidatePath("/admin/roles");
  return {
    ok: true,
    message: isSystem
      ? "Rol actualizado. El rol Administrator conserva todos los permisos."
      : "Rol actualizado.",
  };
}

export async function deleteRole(id: string): Promise<ActionResult> {
  try {
    await requirePermission("roles.manage");
  } catch {
    return { ok: false, message: "No tienes permiso para gestionar roles." };
  }

  const role = await prisma.role.findUnique({
    where: { id },
    include: { _count: { select: { users: true } } },
  });
  if (!role) return { ok: false, message: "El rol no existe." };
  if (role.name === SYSTEM_ROLE) {
    return { ok: false, message: "No se puede eliminar el rol Administrator." };
  }
  if (role._count.users > 0) {
    return {
      ok: false,
      message: `No se puede eliminar: ${role._count.users} usuario(s) tienen este rol. Reasígnalos primero.`,
    };
  }

  try {
    await prisma.role.delete({ where: { id } });
  } catch (error) {
    console.error("deleteRole failed:", error);
    return { ok: false, message: "No se pudo eliminar el rol." };
  }

  revalidatePath("/admin/roles");
  return { ok: true, message: "Rol eliminado." };
}
