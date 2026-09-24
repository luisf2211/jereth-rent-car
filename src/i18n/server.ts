import "server-only";
import { cookies, headers } from "next/headers";

import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  normalizeLocale,
  resolveLocaleFromAcceptLanguage,
  type Locale,
} from "./config";
import type { Dictionary } from "./dictionaries/es";
import { createTranslator, type TFunction } from "./translate";

/**
 * Load a dictionary for the given locale. Dynamic import so only the requested
 * language ships. To add a language: add a case here + a dictionary file.
 */
export async function getDictionary(locale: Locale): Promise<Dictionary> {
  switch (locale) {
    case "es":
      return (await import("./dictionaries/es")).default;
    case "en":
      return (await import("./dictionaries/en")).default;
    default:
      return (await import("./dictionaries/en")).default;
  }
}

/**
 * Resolve the active locale on the server:
 * 1) NEXT_LOCALE cookie (set by the proxy or a manual header selection), else
 * 2) Accept-Language header, else
 * 3) DEFAULT_LOCALE.
 */
export async function getServerLocale(): Promise<Locale> {
  const cookieStore = await cookies();
  const fromCookie = cookieStore.get(LOCALE_COOKIE)?.value;
  if (fromCookie) return normalizeLocale(fromCookie);

  const headerStore = await headers();
  const acceptLanguage = headerStore.get("accept-language");
  if (acceptLanguage) return resolveLocaleFromAcceptLanguage(acceptLanguage);

  return DEFAULT_LOCALE;
}

/**
 * Convenience for server components/pages: returns the active locale, its
 * dictionary and a bound translator in one call.
 */
export async function getI18n(): Promise<{
  locale: Locale;
  dict: Dictionary;
  t: TFunction;
}> {
  const locale = await getServerLocale();
  const dict = await getDictionary(locale);
  return { locale, dict, t: createTranslator(dict) };
}
