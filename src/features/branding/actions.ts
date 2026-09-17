"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/current-user";
import { z } from "zod";
import { brandingSchema } from "@/lib/validations/branding";
import type { ActionResult } from "@/lib/actions/result";

function fieldErrorsFrom(error: z.ZodError): Record<string, string> {
  const flat = z.flattenError(error).fieldErrors as Record<string, string[] | undefined>;
  const out: Record<string, string> = {};
  for (const [key, msgs] of Object.entries(flat)) {
    if (msgs && msgs.length) out[key] = msgs[0]!;
  }
  return out;
}

export async function uploadLogo(formData: FormData): Promise<
  { ok: true; url: string } | { ok: false; message: string }
> {
  try {
    await requirePermission("branding.edit");
  } catch {
    return { ok: false, message: "No tienes permiso para subir el logo." };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Selecciona una imagen." };
  }

  const { uploadImage, STORAGE_FOLDERS } = await import("@/lib/storage/upload");
  const res = await uploadImage(STORAGE_FOLDERS.branding, file);
  if (!res.ok || !res.url) {
    return { ok: false, message: res.error ?? "No se pudo subir el logo." };
  }
  return { ok: true, url: res.url };
}

export async function updateBranding(input: unknown): Promise<ActionResult> {
  try {
    await requirePermission("branding.edit");
  } catch {
    return { ok: false, message: "No tienes permiso para editar el branding." };
  }

  const parsed = brandingSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Revisa los campos.", fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  const { companyName, contactEmail, whatsappNumber, logoUrl, primaryColor } = parsed.data;
  const data = {
    companyName,
    contactEmail,
    whatsappNumber,
    logoUrl: logoUrl ? logoUrl : null,
    primaryColor: primaryColor ? primaryColor : null,
  };

  try {
    const existing = await prisma.companySettings.findFirst({ orderBy: { createdAt: "asc" } });
    if (existing) {
      await prisma.companySettings.update({ where: { id: existing.id }, data });
    } else {
      await prisma.companySettings.create({ data });
    }
  } catch (error) {
    console.error("updateBranding failed:", error);
    return { ok: false, message: "No se pudo guardar el branding." };
  }

  // Branding affects the whole site.
  revalidatePath("/", "layout");
  return { ok: true, message: "Branding actualizado." };
}
