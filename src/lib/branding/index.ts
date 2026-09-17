import type { CompanySettings } from "@/types/branding";
import prisma from "@/lib/prisma";

/**
 * Single source of truth for company branding.
 *
 * Reads the single CompanySettings row from the database. If none exists yet
 * (fresh DB before seed), falls back to sensible defaults so the UI never
 * breaks. When multi-tenancy arrives, this gains a tenant argument.
 */
const FALLBACK_SETTINGS: CompanySettings = {
  companyName: "DriveNow Rent Car",
  logoUrl: null,
  whatsappNumber: "18095551234",
  primaryColor: null,
  contactEmail: "reservas@drivenow.com",
  socialLinks: {
    instagram: "https://instagram.com",
    facebook: "https://facebook.com",
  },
};

export async function getCompanySettings(): Promise<CompanySettings> {
  try {
    const row = await prisma.companySettings.findFirst({
      orderBy: { createdAt: "asc" },
    });
    if (!row) return FALLBACK_SETTINGS;

    return {
      companyName: row.companyName,
      logoUrl: row.logoUrl,
      whatsappNumber: row.whatsappNumber,
      primaryColor: row.primaryColor,
      contactEmail: row.contactEmail,
      // Social links are not modeled in the DB yet; keep defaults for now.
      socialLinks: FALLBACK_SETTINGS.socialLinks,
    };
  } catch (error) {
    console.error("getCompanySettings failed, using fallback:", error);
    return FALLBACK_SETTINGS;
  }
}
