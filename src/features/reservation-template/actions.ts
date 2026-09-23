"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/current-user";
import type { ActionResult } from "@/lib/actions/result";
import type { TemplateDocument } from "./types";

/**
 * The template document is a tree we fully control from the builder. We keep a
 * light Zod guard (bounded, shape-checked) rather than mirroring every element
 * variant — the builder always emits valid nodes, and the renderer is
 * defensive. This prevents obviously malformed payloads without duplicating
 * the whole type union.
 */
// A lenient numeric guard for layout fields: any finite number is accepted
// (the builder can legitimately emit decimals like 12.5px from the number
// inputs), bounded to a sane range, and null/undefined are allowed. We never
// reject a valid visual layout over int-vs-float or an empty value.
const layoutNumber = z.number().finite().min(-1000).max(5000).nullish();
// Colors / short strings: allow generous length + null/empty.
const layoutText = z.string().max(120).nullish();

const elementSchema = z
  .object({
    id: z.string().min(1),
    type: z.string().min(1),
    // Style is a free-form record controlled by the builder; keep it permissive.
    style: z.record(z.string(), z.unknown()).optional().default({}),
  })
  .passthrough();

const rowSchema = z
  .object({
    id: z.string().min(1),
    columns: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    cells: z.array(z.array(elementSchema)).max(3),
    height: layoutNumber,
    background: layoutText,
    paddingX: layoutNumber,
    paddingY: layoutNumber,
    gap: layoutNumber,
  })
  .passthrough();

const documentSchema = z.object({
  version: z.literal(1),
  page: z.object({
    paddingX: layoutNumber.default(0),
    paddingY: layoutNumber.default(0),
    background: layoutText.default("#FFFFFF"),
  }).passthrough(),
  rows: z.array(rowSchema).max(80),
});

async function upsertTemplate(status: "draft" | "published", document: TemplateDocument, name: string) {
  const existing = await prisma.reservationTemplate.findFirst({ where: { status }, orderBy: { updatedAt: "desc" } });
  const data = { status, document: document as unknown as object, name };
  if (existing) {
    await prisma.reservationTemplate.update({ where: { id: existing.id }, data });
  } else {
    await prisma.reservationTemplate.create({ data });
  }
}

/** Saves the working DRAFT (does not affect the published template). */
export async function saveReservationTemplateDraft(input: unknown): Promise<ActionResult> {
  try {
    await requirePermission("reservations.settings");
  } catch {
    return { ok: false, message: "No tienes permiso para editar la plantilla." };
  }
  const rawDocument = (input as { document?: unknown })?.document ?? input;
  const parsed = documentSchema.safeParse(rawDocument);
  if (!parsed.success) {
    return { ok: false, message: "La plantilla tiene un formato inválido." };
  }
  const name = typeof (input as { name?: unknown })?.name === "string" ? (input as { name: string }).name : "Plantilla de reserva";
  try {
    // Persist the ORIGINAL document (validation only gates; it must not alter
    // the exact layout the admin organized).
    await upsertTemplate("draft", rawDocument as TemplateDocument, name);
  } catch (error) {
    console.error("saveReservationTemplateDraft failed:", error);
    return { ok: false, message: "No se pudo guardar el borrador." };
  }
  revalidatePath("/admin/reservations/template");
  return { ok: true, message: "Borrador guardado." };
}

/**
 * PUBLISHES the template. Guarantees a single published row: any previous
 * published template is demoted, then the given document becomes the published
 * one. The draft is left intact so the admin can keep iterating.
 */
export async function publishReservationTemplate(input: unknown): Promise<ActionResult> {
  try {
    await requirePermission("reservations.settings");
  } catch {
    return { ok: false, message: "No tienes permiso para publicar la plantilla." };
  }
  const rawDocument = (input as { document?: unknown })?.document ?? input;
  const parsed = documentSchema.safeParse(rawDocument);
  if (!parsed.success) {
    return { ok: false, message: "La plantilla tiene un formato inválido." };
  }
  const name = typeof (input as { name?: unknown })?.name === "string" ? (input as { name: string }).name : "Plantilla de reserva";
  // Persist the ORIGINAL document (validation only gates; never transforms).
  const doc = rawDocument as TemplateDocument;
  try {
    // Enforce a single published template: keep the most recent published row
    // (update it) and remove any extras, so there is never more than one.
    const published = await prisma.reservationTemplate.findMany({ where: { status: "published" }, orderBy: { updatedAt: "desc" } });
    if (published.length === 0) {
      await prisma.reservationTemplate.create({ data: { status: "published", document: doc as unknown as object, name } });
    } else {
      const [keep, ...extras] = published;
      await prisma.reservationTemplate.update({ where: { id: keep.id }, data: { status: "published", document: doc as unknown as object, name } });
      if (extras.length > 0) {
        await prisma.reservationTemplate.deleteMany({ where: { id: { in: extras.map((e) => e.id) } } });
      }
    }
    // Keep the draft in sync so re-opening the editor shows the published state.
    await upsertTemplate("draft", doc, name);
  } catch (error) {
    console.error("publishReservationTemplate failed:", error);
    return { ok: false, message: "No se pudo publicar la plantilla." };
  }
  revalidatePath("/admin/reservations/template");
  return { ok: true, message: "Plantilla publicada." };
}
