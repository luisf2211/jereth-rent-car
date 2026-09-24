/**
 * i18n configuration for the PUBLIC site.
 *
 * Locale is resolved WITHOUT changing URLs/slugs: it lives in a cookie
 * (NEXT_LOCALE). The middleware sets it from the browser's Accept-Language on
 * first visit; a manual selection in the header overwrites it and wins from
 * then on. Server components read the cookie via next/headers; client
 * components read it via the LanguageProvider context.
 *
 * To add a new language later: add it to LOCALES, create a dictionary file,
 * and register it in getDictionary()/dictionaries. No page rewrites needed.
 */

export const LOCALES = ["es", "en"] as const;
export type Locale = (typeof LOCALES)[number];

/** Fallback used for any unsupported browser language. */
export const DEFAULT_LOCALE: Locale = "en";

/** Cookie that stores the resolved/selected locale. */
export const LOCALE_COOKIE = "NEXT_LOCALE";
/** One year — remember the choice across visits. */
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function isLocale(value: unknown): value is Locale {
  return typeof value === "string" && (LOCALES as readonly string[]).includes(value);
}

/**
 * Map an Accept-Language header (or any BCP-47 tag list) to a supported
 * locale. Spanish (es, es-*) → es; English (en, en-*) → en; anything else →
 * DEFAULT_LOCALE (English).
 */
export function resolveLocaleFromAcceptLanguage(header: string | null | undefined): Locale {
  if (!header) return DEFAULT_LOCALE;
  // Parse "es-DO,es;q=0.9,en;q=0.8" into ordered base languages.
  const langs = header
    .split(",")
    .map((part) => {
      const [tag, q] = part.trim().split(";q=");
      return { tag: tag.trim().toLowerCase(), q: q ? parseFloat(q) : 1 };
    })
    .filter((x) => x.tag)
    .sort((a, b) => b.q - a.q);

  for (const { tag } of langs) {
    const base = tag.split("-")[0];
    if (base === "es") return "es";
    if (base === "en") return "en";
  }
  return DEFAULT_LOCALE;
}

/** Normalize any incoming value to a supported locale (fallback English). */
export function normalizeLocale(value: unknown): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}
