import { z } from "zod";

const currentYear = new Date().getFullYear();

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
  passengers: z.coerce.number().int().min(1, "Mínimo 1").max(20, "Máximo 20"),
  dailyPrice: z.coerce.number().int("Precio inválido").min(1, "Precio inválido").max(100000),
  imageUrl: z.string().trim().url("Sube una imagen o pega una URL válida").max(500),
  images: z.array(z.string().trim().url().max(500)).max(12).default([]),
  description: z.string().trim().max(1000).optional().or(z.literal("")),
  features: z.array(z.string().trim().min(1).max(60)).max(30).default([]),
  whatsappMessage: z.string().trim().max(400).optional().or(z.literal("")),
  isActive: z.boolean(),
});

export type VehicleInput = z.infer<typeof vehicleSchema>;
