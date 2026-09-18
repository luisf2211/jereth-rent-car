"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/current-user";
import { deliveryLocationSchema } from "@/lib/validations/delivery-location";
import type { ActionResult } from "@/lib/actions/result";

function fieldErrorsFrom(error: z.ZodError): Record<string, string> {
  const flat = z.flattenError(error).fieldErrors as Record<string, string[] | undefined>;
  const out: Record<string, string> = {};
  for (const [key, msgs] of Object.entries(flat)) {
    if (msgs && msgs.length) out[key] = msgs[0]!;
  }
  return out;
}

function revalidateDelivery() {
  // Locations show across the public site (home + vehicle detail) and admin.
  revalidatePath("/", "layout");
  revalidatePath("/admin/delivery");
}

async function guard(): Promise<ActionResult | null> {
  try {
    await requirePermission("delivery.edit");
    return null;
  } catch {
    return { ok: false, message: "No tienes permiso para editar lugares de entrega." };
  }
}

export async function saveDeliveryLocation(
  id: string | null,
  input: unknown
): Promise<ActionResult> {
  const denied = await guard();
  if (denied) return denied;

  const parsed = deliveryLocationSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Revisa los campos.", fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  const data = {
    ...parsed.data,
    description: parsed.data.description || null,
    mapUrl: parsed.data.mapUrl || null,
  };

  try {
    if (id) await prisma.deliveryLocation.update({ where: { id }, data });
    else await prisma.deliveryLocation.create({ data });
  } catch (error) {
    console.error("saveDeliveryLocation failed:", error);
    return { ok: false, message: "No se pudo guardar el lugar de entrega." };
  }
  revalidateDelivery();
  return { ok: true, message: "Lugar de entrega guardado." };
}

export async function deleteDeliveryLocation(id: string): Promise<ActionResult> {
  const denied = await guard();
  if (denied) return denied;
  try {
    await prisma.deliveryLocation.delete({ where: { id } });
  } catch (error) {
    console.error("deleteDeliveryLocation failed:", error);
    return { ok: false, message: "No se pudo eliminar." };
  }
  revalidateDelivery();
  return { ok: true, message: "Lugar eliminado." };
}
