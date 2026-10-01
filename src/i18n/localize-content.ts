/**
 * Localized dynamic-content resolver (hybrid translation).
 *
 * The owner authors content in Spanish (the SOURCE). An optional English
 * version may exist per field. This helper picks the right value for the
 * active locale with a SAFE FALLBACK: when the English value is missing/empty,
 * it returns the Spanish source so the public site never shows an empty field.
 *
 * Design goals:
 *  - One place for the ES/EN selection + fallback rule (no per-component logic).
 *  - Generic, reusable primitives (`localizedText`, `localizedList`) so future
 *    dynamic modules (delivery locations, FAQ, requirements, policies, …) can
 *    reuse the same rule without duplicating it.
 *  - Pure functions, no I/O — safe for Server Components and tests.
 */
import type { Locale } from "./config";
import type { Vehicle } from "@/types/vehicle";

/** True when a string has actual visible content (not null/empty/whitespace). */
function hasText(value: string | null | undefined): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

/**
 * Resolve a single translatable text field.
 * - locale "es"  → always the Spanish source.
 * - locale "en"  → the English value if it has content, else the Spanish source.
 * Spanish source is the last-resort fallback so nothing ever renders empty.
 */
export function localizedText(
  locale: Locale,
  source: string | null | undefined,
  english: string | null | undefined,
): string | null {
  if (locale === "en" && hasText(english)) return english;
  return hasText(source) ? source : null;
}

/**
 * Resolve a translatable list (array of strings).
 * - locale "es"  → the Spanish source list.
 * - locale "en"  → the English list if it has at least one item, else the
 *                  Spanish source list.
 * Never returns an English empty list in place of a non-empty Spanish one.
 */
export function localizedList(
  locale: Locale,
  source: string[] | null | undefined,
  english: string[] | null | undefined,
): string[] {
  if (locale === "en" && Array.isArray(english) && english.length > 0) return english;
  return Array.isArray(source) ? source : [];
}

/** Shape of a vehicle's localized, render-ready dynamic content. */
export interface LocalizedVehicleContent {
  /** Description for the active locale (ES source, or EN when available). */
  description: string | null;
  /** Features list for the active locale (ES source, or EN when available). */
  features: string[];
}

/**
 * Resolve a vehicle's translatable content (description + features) for the
 * active locale, applying the safe Spanish fallback. Does NOT touch any other
 * field (brand/model/price/etc. are never localized here).
 */
export function resolveLocalizedVehicle(
  vehicle: Pick<Vehicle, "description" | "features" | "descriptionEn" | "featuresEn">,
  locale: Locale,
): LocalizedVehicleContent {
  return {
    description: localizedText(locale, vehicle.description, vehicle.descriptionEn),
    features: localizedList(locale, vehicle.features, vehicle.featuresEn),
  };
}
