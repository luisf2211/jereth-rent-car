import { z } from "zod";

/** Requisito para rentar. */
export const requirementSchema = z.object({
  text: z.string().trim().min(2, "El texto es obligatorio").max(200),
  sortOrder: z.coerce.number().int().min(0).max(999),
  isActive: z.boolean(),
});

/** Lugar de entrega. */
export const deliveryLocationSchema = z.object({
  name: z.string().trim().min(2, "El nombre es obligatorio").max(120),
  description: z.string().trim().max(400).optional().or(z.literal("")),
  highlighted: z.boolean(),
  sortOrder: z.coerce.number().int().min(0).max(999),
  isActive: z.boolean(),
});

/** Pregunta frecuente. */
export const faqSchema = z.object({
  question: z.string().trim().min(4, "La pregunta es obligatoria").max(200),
  answer: z.string().trim().min(2, "La respuesta es obligatoria").max(1200),
  sortOrder: z.coerce.number().int().min(0).max(999),
  isActive: z.boolean(),
});

/** Reseña de cliente (reales; nunca inventadas). */
export const reviewSchema = z.object({
  authorName: z.string().trim().min(2, "El nombre es obligatorio").max(120),
  rating: z.coerce.number().int().min(1, "Mínimo 1").max(5, "Máximo 5"),
  comment: z.string().trim().min(2, "El comentario es obligatorio").max(1000),
  avatarUrl: z.string().trim().url("URL inválida").max(500).optional().or(z.literal("")),
  source: z.string().trim().max(40),
  sortOrder: z.coerce.number().int().min(0).max(999),
  isActive: z.boolean(),
});

export type RequirementInput = z.infer<typeof requirementSchema>;
export type DeliveryLocationInput = z.infer<typeof deliveryLocationSchema>;
export type FaqInput = z.infer<typeof faqSchema>;
export type ReviewInput = z.infer<typeof reviewSchema>;
