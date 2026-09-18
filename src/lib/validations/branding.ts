import { z } from "zod";

const optionalUrl = z.string().trim().url("URL inválida").max(500).optional().or(z.literal(""));

/**
 * Branding (CompanySettings) validation, shared by form and server action.
 * Contact/social/location fields are optional — the site only renders what's
 * filled in.
 */
export const brandingSchema = z.object({
  companyName: z.string().trim().min(2, "El nombre es obligatorio").max(120),
  contactEmail: z.string().trim().toLowerCase().email("Email inválido").optional().or(z.literal("")),
  whatsappNumber: z
    .string()
    .trim()
    .regex(/^\d{8,15}$/, "Solo dígitos, formato internacional (8-15)")
    .optional()
    .or(z.literal("")),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  logoUrl: optionalUrl,
  footerLogoUrl: optionalUrl,
  instagramUrl: optionalUrl,
  facebookUrl: optionalUrl,
  googleMapsUrl: optionalUrl,
  address: z.string().trim().max(200).optional().or(z.literal("")),
  aboutText: z.string().trim().max(1200).optional().or(z.literal("")),
  heroImageUrl: optionalUrl,
  heroTitle: z.string().trim().max(120).optional().or(z.literal("")),
  heroSubtitle: z.string().trim().max(300).optional().or(z.literal("")),
  logoScale: z.coerce.number().min(0.8).max(3).default(1),
  navLogoScale: z.coerce.number().min(0.8).max(3).default(1),
  primaryColor: z
    .string()
    .trim()
    .regex(/^#([0-9a-fA-F]{6})$/, "Formato hex, ej. #E6007A")
    .optional()
    .or(z.literal("")),
});

export type BrandingInput = z.infer<typeof brandingSchema>;
