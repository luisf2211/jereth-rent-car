import { z } from "zod";

/** Requisito para rentar. */
export const requirementSchema = z.object({
  text: z.string().trim().min(2, "El texto es obligatorio").max(200),
  sortOrder: z.coerce.number().int().min(0).max(999),
  isActive: z.boolean(),
});

/** Simple text item (inclusiones / políticas) — mismo shape que requisito. */
export const simpleTextSchema = requirementSchema;

/** Pregunta frecuente. */
export const faqSchema = z.object({
  question: z.string().trim().min(4, "La pregunta es obligatoria").max(200),
  answer: z.string().trim().min(2, "La respuesta es obligatoria").max(1200),
  sortOrder: z.coerce.number().int().min(0).max(999),
  isActive: z.boolean(),
});

/** Origen de una reseña: agregada a mano o importada de Google. */
export const REVIEW_SOURCES = ["manual", "google"] as const;
export type ReviewSource = (typeof REVIEW_SOURCES)[number];

/** Reseña de cliente (reales; nunca inventadas). */
export const reviewSchema = z.object({
  authorName: z.string().trim().min(2, "El nombre es obligatorio").max(120),
  rating: z.coerce.number().int().min(1, "Mínimo 1").max(5, "Máximo 5"),
  comment: z.string().trim().min(2, "El comentario es obligatorio").max(1000),
  avatarUrl: z.string().trim().url("URL inválida").max(500).optional().or(z.literal("")),
  // Origin of the review. "manual" = added from the backoffice, "google" =
  // imported from Google reviews. Restricted to known values.
  source: z.enum(REVIEW_SOURCES).default("manual"),
  // Optional review date (YYYY-MM-DD from the admin date input, or empty).
  reviewDate: z.string().trim().max(40).optional().or(z.literal("")),
  sortOrder: z.coerce.number().int().min(0).max(999),
  isActive: z.boolean(),
});

export type RequirementInput = z.infer<typeof requirementSchema>;
export type FaqInput = z.infer<typeof faqSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
