import prisma from "@/lib/prisma";

export interface BrandingFormData {
  companyName: string;
  contactEmail: string;
  whatsappNumber: string;
  logoUrl: string;
  primaryColor: string;
}

const EMPTY: BrandingFormData = {
  companyName: "",
  contactEmail: "",
  whatsappNumber: "",
  logoUrl: "",
  primaryColor: "",
};

/** Editable branding fields for the admin form. */
export async function getBrandingFormData(): Promise<BrandingFormData> {
  const row = await prisma.companySettings.findFirst({ orderBy: { createdAt: "asc" } });
  if (!row) return EMPTY;
  return {
    companyName: row.companyName,
    contactEmail: row.contactEmail,
    whatsappNumber: row.whatsappNumber,
    logoUrl: row.logoUrl ?? "",
    primaryColor: row.primaryColor ?? "",
  };
}
