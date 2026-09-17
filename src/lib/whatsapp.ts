/**
 * Builds a wa.me deep link with a prefilled message.
 * Central helper so the URL format is defined in exactly one place.
 */
export function buildWhatsAppUrl(phoneNumber: string, message: string): string {
  const digits = phoneNumber.replace(/\D/g, "");
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
