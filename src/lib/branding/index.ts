import type { CompanySettings } from "@/types/branding";

/**
 * Single source of truth for company branding.
 *
 * Phase 1: static/mock config. Phase 2: this function becomes an async
 * read from the `CompanySettings` table via Prisma. Consumers should call
 * `getCompanySettings()` rather than importing the constant directly, so
 * the eventual switch to async DB access is a one-line change here.
 */
const MOCK_COMPANY_SETTINGS: CompanySettings = {
  companyName: "DriveNow Rent Car",
  logoUrl: null, // falls back to the text/icon Logo component
  whatsappNumber: "18095551234",
  primaryColor: null, // null => use theme default
  contactEmail: "reservas@drivenow.com",
  socialLinks: {
    instagram: "https://instagram.com",
    facebook: "https://facebook.com",
  },
};

export function getCompanySettings(): CompanySettings {
  return MOCK_COMPANY_SETTINGS;
}
