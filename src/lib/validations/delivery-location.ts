import { z } from "zod";

/**
 * Delivery / pickup location. Each location can carry its own delivery fee
 * (added to the rental total when chosen) and an optional map URL.
 */
export const deliveryLocationSchema = z.object({
  name: z.string().trim().min(2, "El nombre es obligatorio").max(120),
  description: z.string().trim().max(400).optional().or(z.literal("")),
  imageUrl: z.string().trim().url("URL inválida").max(500).optional().or(z.literal("")),
  deliveryFee: z.coerce.number().int().min(0, "No puede ser negativo").max(100000).default(0),
  mapUrl: z.string().trim().url("URL inválida").max(500).optional().or(z.literal("")),
  highlighted: z.boolean(),
  sortOrder: z.coerce.number().int().min(0).max(999),
  isActive: z.boolean(),
});

export type DeliveryLocationInput = z.infer<typeof deliveryLocationSchema>;
