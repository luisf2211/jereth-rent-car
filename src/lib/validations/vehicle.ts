import { z } from "zod";

const currentYear = new Date().getFullYear();

/**
 * Framing data for a single photo.
 * x/y are the focal-point percentages (0–100, default 50/50 = center).
 * zoom is a scale multiplier (1 = no zoom, >1 zooms in).
 */
export const imageFitSchema = z.object({
  x: z.number().min(0).max(100).default(50),
  y: z.number().min(0).max(100).default(50),
  zoom: z.number().min(1).max(4).default(1),
});

export type ImageFit = z.infer<typeof imageFitSchema>;

/**
 * Map from photo key → ImageFit.
 * Keys: "cover", "carousel", or the raw photo URL (for gallery images).
 */
export const imageFitsSchema = z.record(z.string(), imageFitSchema).default({});

export type ImageFits = z.infer<typeof imageFitsSchema>;

/** Default fit used when no framing has been saved for a photo. */
export const DEFAULT_FIT: ImageFit = { x: 50, y: 50, zoom: 1 };

/**
 * Vehicle validation shared by the admin form and the server actions.
 */
export const vehicleSchema = z.object({
  brand: z.string().trim().min(1, "La marca es obligatoria").max(60),
  model: z.string().trim().min(1, "El modelo es obligatorio").max(60),
  year: z.coerce
    .number()
    .int("Año inválido")
    .min(1980, "Año inválido")
    .max(currentYear + 1, "Año inválido"),
  category: z.enum(["economico", "compacto", "sedan", "suv", "suv_grande", "premium"]),
  orSimilar: z.boolean(),
  transmission: z.enum(["automatic", "manual"]),
  fuelType: z.enum(["gasolina", "diesel", "hibrido", "electrico"]),
  passengers: z.coerce.number().int().min(1, "Mínimo 1").max(20, "Máximo 20"),
  doors: z.coerce.number().int().min(2, "Mínimo 2").max(6, "Máximo 6"),
  dailyPrice: z.coerce.number().int("Precio inválido").min(1, "Precio inválido").max(100000),
  imageUrl: z.string().trim().url("Sube una imagen o pega una URL válida").max(500),
  carouselImageUrl: z.string().trim().url().max(500).optional().or(z.literal("")),
  images: z.array(z.string().trim().url().max(500)).max(12).default([]),
  // Per-photo framing: keyed by "cover", "carousel", or photo URL.
  imageFits: imageFitsSchema,
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  features: z.array(z.string().trim().min(1).max(60)).max(30).default([]),
  whatsappMessage: z.string().trim().max(400).optional().or(z.literal("")),
  isActive: z.boolean(),
});

export type VehicleInput = z.infer<typeof vehicleSchema>;
