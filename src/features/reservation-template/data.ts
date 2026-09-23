import { cache } from "react";
import prisma from "@/lib/prisma";
import type { TemplateDocument } from "./types";
import { emptyTemplate } from "./types";

export interface ReservationTemplateData {
  id: string;
  name: string;
  status: "draft" | "published";
  document: TemplateDocument;
  updatedAt: string;
}

function toData(row: {
  id: string;
  name: string;
  status: string;
  document: unknown;
  updatedAt: Date;
}): ReservationTemplateData {
  return {
    id: row.id,
    name: row.name,
    status: row.status === "published" ? "published" : "draft",
    document: (row.document as TemplateDocument) ?? emptyTemplate(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

/**
 * The template the admin edits: prefer the draft; if none, fall back to the
 * published one; if neither exists, an empty starter. Cached per request.
 */
export const getEditableReservationTemplate = cache(async (): Promise<ReservationTemplateData | null> => {
  const draft = await prisma.reservationTemplate.findFirst({ where: { status: "draft" }, orderBy: { updatedAt: "desc" } });
  if (draft) return toData(draft);
  const published = await prisma.reservationTemplate.findFirst({ where: { status: "published" }, orderBy: { updatedAt: "desc" } });
  return published ? toData(published) : null;
});

/** The currently published template (used later by PDF generation). */
export const getPublishedReservationTemplate = cache(async (): Promise<ReservationTemplateData | null> => {
  const row = await prisma.reservationTemplate.findFirst({ where: { status: "published" }, orderBy: { updatedAt: "desc" } });
  return row ? toData(row) : null;
});
