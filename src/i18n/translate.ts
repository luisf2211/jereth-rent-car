import type { Dictionary } from "./dictionaries/es";

/**
 * Interpolation vars for a translation string. Values are coerced to string.
 */
export type TranslateVars = Record<string, string | number>;

/**
 * A bound translator: `t("nav.home")` or `t("hero.viewVehicle", { title })`.
 * Walks a dot-path into the dictionary and replaces {placeholders}.
 *
 * Falls back to returning the key itself if the path is missing, so a typo is
 * visible in the UI instead of crashing.
 */
export type TFunction = (key: string, vars?: TranslateVars) => string;

function interpolate(template: string, vars?: TranslateVars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (match, name: string) => {
    const value = vars[name];
    return value === undefined || value === null ? match : String(value);
  });
}

/** Resolve a dot-path like "reservationForm.fullName" against the dictionary. */
function lookup(dict: Dictionary, key: string): string | undefined {
  const parts = key.split(".");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let node: any = dict;
  for (const part of parts) {
    if (node && typeof node === "object" && part in node) {
      node = node[part];
    } else {
      return undefined;
    }
  }
  return typeof node === "string" ? node : undefined;
}

/** Build a translator bound to a specific dictionary. */
export function createTranslator(dict: Dictionary): TFunction {
  return (key, vars) => {
    const template = lookup(dict, key);
    if (template === undefined) {
      if (process.env.NODE_ENV !== "production") {
        // Surface missing keys during development.
        console.warn(`[i18n] missing key: ${key}`);
      }
      return key;
    }
    return interpolate(template, vars);
  };
}
