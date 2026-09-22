"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/current-user";
import {
  requirementSchema,
  simpleTextSchema,
  faqSchema,
  reviewSchema,
} from "@/lib/validations/content";
import type { ActionResult } from "@/lib/actions/result";

function fieldErrorsFrom(error: z.ZodError): Record<string, string> {
  const flat = z.flattenError(error).fieldErrors as Record<string, string[] | undefined>;
  const out: Record<string, string> = {};
  for (const [key, msgs] of Object.entries(flat)) {
    if (msgs && msgs.length) out[key] = msgs[0]!;
  }
  return out;
}

function revalidateContent() {
  // Content shows across the public site and admin.
  revalidatePath("/", "layout");
  revalidatePath("/admin/content");
}

async function guard(): Promise<ActionResult | null> {
  try {
    await requirePermission("content.edit");
    return null;
  } catch {
    return { ok: false, message: "No tienes permiso para editar contenido." };
  }
}

/* ------------------------------- Requirements ---------------------------- */

export async function saveRequirement(id: string | null, input: unknown): Promise<ActionResult> {
  const denied = await guard();
  if (denied) return denied;

  const parsed = requirementSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Revisa los campos.", fieldErrors: fieldErrorsFrom(parsed.error) };

  try {
    if (id) await prisma.requirement.update({ where: { id }, data: parsed.data });
    else await prisma.requirement.create({ data: parsed.data });
  } catch (error) {
    console.error("saveRequirement failed:", error);
    return { ok: false, message: "No se pudo guardar el requisito." };
  }
  revalidateContent();
  return { ok: true, message: "Requisito guardado." };
}

export async function deleteRequirement(id: string): Promise<ActionResult> {
  const denied = await guard();
  if (denied) return denied;
  try {
    await prisma.requirement.delete({ where: { id } });
  } catch (error) {
    console.error("deleteRequirement failed:", error);
    return { ok: false, message: "No se pudo eliminar." };
  }
  revalidateContent();
  return { ok: true, message: "Requisito eliminado." };
}

/* ------------------------------ Inclusions ------------------------------- */

export async function saveInclusion(id: string | null, input: unknown): Promise<ActionResult> {
  const denied = await guard();
  if (denied) return denied;
  const parsed = simpleTextSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Revisa los campos.", fieldErrors: fieldErrorsFrom(parsed.error) };
  try {
    if (id) await prisma.inclusion.update({ where: { id }, data: parsed.data });
    else await prisma.inclusion.create({ data: parsed.data });
  } catch (error) {
    console.error("saveInclusion failed:", error);
    return { ok: false, message: "No se pudo guardar." };
  }
  revalidateContent();
  return { ok: true, message: "Guardado." };
}

export async function deleteInclusion(id: string): Promise<ActionResult> {
  const denied = await guard();
  if (denied) return denied;
  try {
    await prisma.inclusion.delete({ where: { id } });
  } catch (error) {
    console.error("deleteInclusion failed:", error);
    return { ok: false, message: "No se pudo eliminar." };
  }
  revalidateContent();
  return { ok: true, message: "Eliminado." };
}

/* -------------------------------- Policies ------------------------------- */

export async function savePolicy(id: string | null, input: unknown): Promise<ActionResult> {
  const denied = await guard();
  if (denied) return denied;
  const parsed = simpleTextSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Revisa los campos.", fieldErrors: fieldErrorsFrom(parsed.error) };
  try {
    if (id) await prisma.policy.update({ where: { id }, data: parsed.data });
    else await prisma.policy.create({ data: parsed.data });
  } catch (error) {
    console.error("savePolicy failed:", error);
    return { ok: false, message: "No se pudo guardar." };
  }
  revalidateContent();
  return { ok: true, message: "Guardado." };
}

export async function deletePolicy(id: string): Promise<ActionResult> {
  const denied = await guard();
  if (denied) return denied;
  try {
    await prisma.policy.delete({ where: { id } });
  } catch (error) {
    console.error("deletePolicy failed:", error);
    return { ok: false, message: "No se pudo eliminar." };
  }
  revalidateContent();
  return { ok: true, message: "Eliminado." };
}

/* --------------------------------- FAQ ----------------------------------- */

export async function saveFaq(id: string | null, input: unknown): Promise<ActionResult> {
  const denied = await guard();
  if (denied) return denied;

  const parsed = faqSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Revisa los campos.", fieldErrors: fieldErrorsFrom(parsed.error) };

  try {
    if (id) await prisma.faqItem.update({ where: { id }, data: parsed.data });
    else await prisma.faqItem.create({ data: parsed.data });
  } catch (error) {
    console.error("saveFaq failed:", error);
    return { ok: false, message: "No se pudo guardar la pregunta." };
  }
  revalidateContent();
  return { ok: true, message: "Pregunta guardada." };
}

export async function deleteFaq(id: string): Promise<ActionResult> {
  const denied = await guard();
  if (denied) return denied;
  try {
    await prisma.faqItem.delete({ where: { id } });
  } catch (error) {
    console.error("deleteFaq failed:", error);
    return { ok: false, message: "No se pudo eliminar." };
  }
  revalidateContent();
  return { ok: true, message: "Pregunta eliminada." };
}

/* -------------------------------- Reviews -------------------------------- */

export async function saveReview(id: string | null, input: unknown): Promise<ActionResult> {
  const denied = await guard();
  if (denied) return denied;

  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) return { ok: false, message: "Revisa los campos.", fieldErrors: fieldErrorsFrom(parsed.error) };

  // Parse the optional reviewDate string (YYYY-MM-DD) into a Date, or null.
  let reviewDate: Date | null = null;
  if (parsed.data.reviewDate) {
    const d = new Date(parsed.data.reviewDate);
    reviewDate = Number.isNaN(d.getTime()) ? null : d;
  }

  const data = {
    authorName: parsed.data.authorName,
    rating: parsed.data.rating,
    comment: parsed.data.comment,
    avatarUrl: parsed.data.avatarUrl || null,
    source: parsed.data.source,
    reviewDate,
    sortOrder: parsed.data.sortOrder,
    isActive: parsed.data.isActive,
  };
  try {
    if (id) await prisma.review.update({ where: { id }, data });
    else await prisma.review.create({ data });
  } catch (error) {
    console.error("saveReview failed:", error);
    return { ok: false, message: "No se pudo guardar la reseña." };
  }
  revalidateContent();
  return { ok: true, message: "Reseña guardada." };
}

export async function deleteReview(id: string): Promise<ActionResult> {
  const denied = await guard();
  if (denied) return denied;
  try {
    await prisma.review.delete({ where: { id } });
  } catch (error) {
    console.error("deleteReview failed:", error);
    return { ok: false, message: "No se pudo eliminar." };
  }
  revalidateContent();
  return { ok: true, message: "Reseña eliminada." };
}

/** Uploads a reviewer avatar to Storage (clients/) and returns its URL. */
export async function uploadReviewAvatar(
  formData: FormData
): Promise<{ ok: true; url: string } | { ok: false; message: string }> {
  try {
    await requirePermission("content.edit");
  } catch {
    return { ok: false, message: "No tienes permiso para subir imágenes." };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Selecciona una imagen." };
  }

  const { uploadImage, STORAGE_FOLDERS } = await import("@/lib/storage/upload");
  const res = await uploadImage(STORAGE_FOLDERS.clients, file);
  if (!res.ok || !res.url) {
    return { ok: false, message: res.error ?? "No se pudo subir la imagen." };
  }
  return { ok: true, url: res.url };
}
