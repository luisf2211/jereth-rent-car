"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/current-user";
import { userCreateSchema, userUpdateSchema } from "@/lib/validations/user";
import type { ActionResult } from "@/lib/actions/result";

const SALT_ROUNDS = 10;

/** Maps Zod's flattened field errors into our ActionResult shape. */
function fieldErrorsFrom(error: z.ZodError): Record<string, string> {
  const flat = z.flattenError(error).fieldErrors as Record<string, string[] | undefined>;
  const out: Record<string, string> = {};
  for (const [key, msgs] of Object.entries(flat)) {
    if (msgs && msgs.length) out[key] = msgs[0]!;
  }
  return out;
}

export async function createUser(input: unknown): Promise<ActionResult> {
  try {
    await requirePermission("users.create");
  } catch {
    return { ok: false, message: "No tienes permiso para crear usuarios." };
  }

  const parsed = userCreateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Revisa los campos.", fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  const { name, email, password, roleId, isActive } = parsed.data;
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  try {
    await prisma.user.create({
      data: { name, email, passwordHash, roleId, isActive },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false, message: "Ese email ya está registrado.", fieldErrors: { email: "Email en uso" } };
    }
    console.error("createUser failed:", error);
    return { ok: false, message: "No se pudo crear el usuario." };
  }

  revalidatePath("/admin/users");
  return { ok: true, message: "Usuario creado." };
}

export async function updateUser(id: string, input: unknown): Promise<ActionResult> {
  try {
    await requirePermission("users.edit");
  } catch {
    return { ok: false, message: "No tienes permiso para editar usuarios." };
  }

  const parsed = userUpdateSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Revisa los campos.", fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  const { name, email, password, roleId, isActive } = parsed.data;

  const data: Prisma.UserUpdateInput = {
    name,
    email,
    isActive,
    role: { connect: { id: roleId } },
  };
  if (password && password.length > 0) {
    data.passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  }

  try {
    await prisma.user.update({ where: { id }, data });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return { ok: false, message: "Ese email ya está registrado.", fieldErrors: { email: "Email en uso" } };
    }
    console.error("updateUser failed:", error);
    return { ok: false, message: "No se pudo actualizar el usuario." };
  }

  revalidatePath("/admin/users");
  revalidatePath(`/admin/users/${id}`);
  return { ok: true, message: "Usuario actualizado." };
}

export async function toggleUserActive(id: string, isActive: boolean): Promise<ActionResult> {
  try {
    await requirePermission("users.disable");
  } catch {
    return { ok: false, message: "No tienes permiso para esta acción." };
  }

  try {
    await prisma.user.update({ where: { id }, data: { isActive } });
  } catch (error) {
    console.error("toggleUserActive failed:", error);
    return { ok: false, message: "No se pudo actualizar el estado." };
  }

  revalidatePath("/admin/users");
  return { ok: true, message: isActive ? "Usuario activado." : "Usuario desactivado." };
}
