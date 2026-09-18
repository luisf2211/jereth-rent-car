/**
 * Where a WhatsApp CTA was clicked. Used to build the link and, later, to
 * report conversion context to analytics (GA4/Ads) from one central place.
 */
export type WhatsAppSource =
  | "hero"
  | "vehicle"
  | "airport"
  | "contact"
  | "faq"
  | "floating_button"
  | "header"
  | "final_cta"
  | "delivery";

/**
 * Builds a wa.me deep link with a prefilled message.
 * Central helper so the URL format is defined in exactly one place.
 */
export function buildWhatsAppUrl(phoneNumber: string, message: string): string {
  const digits = phoneNumber.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
