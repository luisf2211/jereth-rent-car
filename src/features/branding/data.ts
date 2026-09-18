import prisma from "@/lib/prisma";

export interface BrandingFormData {
  companyName: string;
  contactEmail: string;
  whatsappNumber: string;
  phone: string;
  logoUrl: string;
  footerLogoUrl: string;
  instagramUrl: string;
  facebookUrl: string;
  googleMapsUrl: string;
  address: string;
  aboutText: string;
  primaryColor: string;
  logoScale: number;
  navLogoScale: number;
}

const EMPTY: BrandingFormData = {
  companyName: "",
  contactEmail: "",
  whatsappNumber: "",
  phone: "",
  logoUrl: "",
  footerLogoUrl: "",
  instagramUrl: "",
  facebookUrl: "",
  googleMapsUrl: "",
  address: "",
  aboutText: "",
  primaryColor: "",
  logoScale: 1,
  navLogoScale: 1,
};

/** Editable branding fields for the admin form. */
export async function getBrandingFormData(): Promise<BrandingFormData> {
  const row = await prisma.companySettings.findFirst({ orderBy: { createdAt: "asc" } });
  if (!row) return EMPTY;
  return {
    companyName: row.companyName,
    contactEmail: row.contactEmail,
    whatsappNumber: row.whatsappNumber,
    phone: row.phone ?? "",
    logoUrl: row.logoUrl ?? "",
    footerLogoUrl: row.footerLogoUrl ?? "",
    instagramUrl: row.instagramUrl ?? "",
    facebookUrl: row.facebookUrl ?? "",
    googleMapsUrl: row.googleMapsUrl ?? "",
    address: row.address ?? "",
    aboutText: row.aboutText ?? "",
    primaryColor: row.primaryColor ?? "",
    logoScale: row.logoScale ?? 1,
    navLogoScale: row.navLogoScale ?? 1,
  };
}
