/**
 * Company branding / settings.
 *
 * Mirrors the future `CompanySettings` table so migrating from a mock
 * source to the database requires no changes in consumers.
 */
export interface CompanySettings {
  companyName: string;
  logoUrl: string | null;
  footerLogoUrl: string | null;
  whatsappNumber: string; // digits only, international format e.g. "18095551234"
  primaryColor: string | null;
  contactEmail: string;
  phone: string | null;
  address: string | null;
  googleMapsUrl: string | null;
  aboutText: string | null;
  /** English version of aboutText (fallback to Spanish when empty). */
  aboutTextEn: string | null;
  heroImageUrl: string | null;
  heroTitle: string | null;
  heroSubtitle: string | null;
  /** English versions of the hero headline/subtitle (fallback to Spanish). */
  heroTitleEn: string | null;
  heroSubtitleEn: string | null;
  logoScale: number;
  navLogoScale: number;
  socialLinks: {
    instagram?: string;
    facebook?: string;
  };
}
