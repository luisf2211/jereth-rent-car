import "server-only";

/**
 * DeepL translation service (server-only).
 *
 * Thin, reusable abstraction over the official DeepL REST API. Keeps the
 * fetch/credentials/error handling in ONE place so any dynamic-content module
 * (vehicles now; delivery locations, FAQ, requirements, policies later) can
 * translate without duplicating logic. No DeepL call should live in a UI
 * component or page.
 *
 * Security:
 *  - "server-only": importing this from a client bundle is a build error, so
 *    the API key can never reach the browser.
 *  - The key is read from process.env.DEEPL_API_KEY (never NEXT_PUBLIC_, never
 *    hardcoded).
 */

/** Error codes callers can branch on without parsing messages. */
export type TranslationErrorCode =
  | "not_configured" // DEEPL_API_KEY missing
  | "empty_input" // nothing to translate
  | "too_large" // input exceeds our safety limit
  | "quota" // DeepL quota exceeded (456)
  | "auth" // invalid key (403)
  | "rate_limited" // DeepL rate limit (429)
  | "service" // other DeepL/API error
  | "network"; // fetch failed / timeout

export class TranslationError extends Error {
  code: TranslationErrorCode;
  constructor(code: TranslationErrorCode, message: string) {
    super(message);
    this.name = "TranslationError";
    this.code = code;
  }
}

/** Max total characters we send in one call (safety guard against abuse/cost). */
export const MAX_TRANSLATION_CHARS = 10_000;

/** True when a DeepL key is present in the server environment. */
export function isDeepLConfigured(): boolean {
  return Boolean(process.env.DEEPL_API_KEY && process.env.DEEPL_API_KEY.trim());
}

/**
 * DeepL endpoint. Free-tier keys end with ":fx" and use api-free; paid keys
 * use api. We auto-select so either tier works with just the key.
 */
function deeplEndpoint(key: string): string {
  return key.trim().endsWith(":fx")
    ? "https://api-free.deepl.com/v2/translate"
    : "https://api.deepl.com/v2/translate";
}

/**
 * Translate one or more Spanish strings to English in a SINGLE request.
 * DeepL accepts repeated `text` params and returns a translation per input,
 * preserving order — so N features cost one network call, not N.
 *
 * Returns translations aligned 1:1 with `inputs`. Throws TranslationError on
 * any failure; callers decide how to surface it (never silently lose data).
 */
export async function translateEsToEn(inputs: string[]): Promise<string[]> {
  const key = process.env.DEEPL_API_KEY?.trim();
  if (!key) {
    throw new TranslationError(
      "not_configured",
      "DeepL no está configurado (falta DEEPL_API_KEY en el servidor).",
    );
  }

  // Only translate non-empty entries; keep a map to restore order/placement.
  const items = inputs.map((s) => (s ?? "").toString());
  const nonEmptyIdx = items.map((s, i) => (s.trim() ? i : -1)).filter((i) => i >= 0);
  if (nonEmptyIdx.length === 0) {
    throw new TranslationError("empty_input", "No hay texto en español para traducir.");
  }

  const totalChars = nonEmptyIdx.reduce((sum, i) => sum + items[i]!.length, 0);
  if (totalChars > MAX_TRANSLATION_CHARS) {
    throw new TranslationError(
      "too_large",
      `El texto a traducir supera el límite de ${MAX_TRANSLATION_CHARS} caracteres.`,
    );
  }

  const body = new URLSearchParams();
  body.set("source_lang", "ES");
  body.set("target_lang", "EN");
  for (const i of nonEmptyIdx) body.append("text", items[i]!);

  let res: Response;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    res = await fetch(deeplEndpoint(key), {
      method: "POST",
      headers: {
        Authorization: `DeepL-Auth-Key ${key}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
      signal: controller.signal,
    });
    clearTimeout(timeout);
  } catch {
    throw new TranslationError("network", "No se pudo conectar con DeepL. Intenta de nuevo.");
  }

  if (!res.ok) {
    if (res.status === 403) throw new TranslationError("auth", "La clave de DeepL no es válida.");
    if (res.status === 429) throw new TranslationError("rate_limited", "DeepL está limitando las peticiones. Intenta en unos segundos.");
    if (res.status === 456) throw new TranslationError("quota", "Se agotó la cuota de DeepL.");
    throw new TranslationError("service", `DeepL respondió con un error (${res.status}).`);
  }

  let data: { translations?: Array<{ text?: string }> };
  try {
    data = (await res.json()) as typeof data;
  } catch {
    throw new TranslationError("service", "Respuesta inesperada de DeepL.");
  }

  const translations = data.translations ?? [];
  if (translations.length !== nonEmptyIdx.length) {
    throw new TranslationError("service", "DeepL devolvió un número inesperado de traducciones.");
  }

  // Rebuild an array aligned with the original inputs (empty stays empty).
  const out = [...items];
  nonEmptyIdx.forEach((originalIdx, k) => {
    out[originalIdx] = (translations[k]?.text ?? "").toString();
  });
  return out;
}

/** Convenience: translate a single string ES→EN. */
export async function translateTextEsToEn(text: string): Promise<string> {
  const [t] = await translateEsToEn([text]);
  return t ?? "";
}
