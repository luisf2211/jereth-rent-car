import { z } from "zod";

/**
 * Branding (CompanySettings) validation, shared by form and server action.
 */
export const brandingSchema = z.object({
  companyName: z.string().trim().min(2, "El nombre es obligatorio").max(120),
  contactEmail: z.string().trim().toLowerCase().email("Email inválido"),
  whatsappNumber: z
    .string()
    .trim()
    .regex(/^\d{8,15}$/, "Solo dígitos, formato internacional (8-15)"),
  logoUrl: z
    .string()
    .trim()
    .url("URL inválida")
    .max(500)
    .optional()
    .or(z.literal("")),
  primaryColor: z
    .string()
    .trim()
    .regex(/^#([0-9a-fA-F]{6})$/, "Formato hex, ej. #E6007A")
    .optional()
    .or(z.literal("")),
});

export type BrandingInput = z.infer<typeof brandingSchema>;
