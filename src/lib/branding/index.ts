import type { CompanySettings } from "@/types/branding";
import prisma from "@/lib/prisma";

/**
 * Single source of truth for company branding.
 *
 * Reads the single CompanySettings row from the database. Contact/social/
 * location fields that the owner hasn't filled in stay null, and the public
 * UI simply doesn't render them (we never show invented data).
 */
const FALLBACK_SETTINGS: CompanySettings = {
  companyName: "Jereth Rent Car",
  logoUrl: null,
  footerLogoUrl: null,
  whatsappNumber: "",
  primaryColor: null,
  contactEmail: "",
  phone: null,
  address: null,
  googleMapsUrl: null,
  aboutText: null,
  heroImageUrl: null,
  heroTitle: null,
  heroSubtitle: null,
  logoScale: 1,
  navLogoScale: 1,
  socialLinks: {},
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
      footerLogoUrl: row.footerLogoUrl,
      whatsappNumber: row.whatsappNumber,
      primaryColor: row.primaryColor,
      contactEmail: row.contactEmail,
      phone: row.phone,
      address: row.address,
      googleMapsUrl: row.googleMapsUrl,
      aboutText: row.aboutText,
      heroImageUrl: row.heroImageUrl,
      heroTitle: row.heroTitle,
      heroSubtitle: row.heroSubtitle,
      logoScale: row.logoScale ?? 1,
      navLogoScale: row.navLogoScale ?? 1,
      socialLinks: {
        instagram: row.instagramUrl ?? undefined,
        facebook: row.facebookUrl ?? undefined,
      },
    };
  } catch (error) {
    console.error("getCompanySettings failed, using fallback:", error);
    return FALLBACK_SETTINGS;
  }
}
