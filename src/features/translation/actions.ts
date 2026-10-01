"use server";

import { z } from "zod";
import { requirePermission } from "@/lib/auth/current-user";
import { rateLimit } from "@/lib/security/rate-limit";
import { translateEsToEn, TranslationError } from "./deepl";

/**
 * On-demand translation server action for vehicle content (ES → EN).
 *
 * Called ONLY when the admin presses "Traducir al inglés". It:
 *  - requires the same admin permission used to edit vehicles,
 *  - rate-limits to protect our DeepL credits,
 *  - validates size/content,
 *  - returns the translated text WITHOUT persisting anything (the admin
 *    reviews/edits it in the form and saves normally).
 *
 * It never writes to the DB and never touches existing English content; the
 * caller decides what to do with the result.
 */

const inputSchema = z.object({
  description: z.string().max(1000).optional().default(""),
  features: z.array(z.string().max(60)).max(30).optional().default([]),
});

export type TranslateResult =
  | {
      ok: true;
      /** Translated description (empty string if there was no Spanish source). */
      descriptionEn: string;
      /** Translated features, aligned with the input order. */
      featuresEn: string[];
    }
  | { ok: false; message: string };

export async function translateVehicleToEnglish(input: unknown): Promise<TranslateResult> {
  // 1) Auth: same permission as editing vehicles. No open/public endpoint.
  try {
    await requirePermission("vehicles.edit");
  } catch {
    return { ok: false, message: "No tienes permiso para traducir contenido." };
  }

  // 2) Rate limit (per admin IP) to guard DeepL credits against abuse.
  const rl = await rateLimit({ bucket: "translate:vehicle", limit: 30, windowMs: 60_000 });
  if (!rl.allowed) {
    return { ok: false, message: `Demasiadas traducciones seguidas. Intenta en ${rl.retryAfter}s.` };
  }

  // 3) Validate shape/size.
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Contenido inválido para traducir." };
  }
  const description = parsed.data.description.trim();
  const features = parsed.data.features.map((f) => f.trim()).filter(Boolean);

  // 4) Nothing in Spanish → nothing to translate (don't call DeepL).
  if (!description && features.length === 0) {
    return { ok: false, message: "No hay contenido en español para traducir." };
  }

  // 5) Build a single batch: [description?, ...features]. One DeepL call total.
  const batch: string[] = [];
  const hasDesc = description.length > 0;
  if (hasDesc) batch.push(description);
  const featStart = batch.length;
  batch.push(...features);

  try {
    const translated = await translateEsToEn(batch);
    const descriptionEn = hasDesc ? (translated[0] ?? "") : "";
    const featuresEn = translated.slice(featStart);
    return { ok: true, descriptionEn, featuresEn };
  } catch (err) {
    // Never lose/alter existing data: just report a clear message. The caller
    // keeps the current form values intact.
    if (err instanceof TranslationError) {
      const map: Record<string, string> = {
        not_configured: "La traducción automática no está configurada todavía (falta la clave de DeepL).",
        empty_input: "No hay contenido en español para traducir.",
        too_large: err.message,
        quota: "Se agotó la cuota de DeepL. Inténtalo más tarde.",
        auth: "La clave de DeepL no es válida. Revisa la configuración.",
        rate_limited: "DeepL está ocupado ahora mismo. Intenta en unos segundos.",
        service: "DeepL no pudo completar la traducción. El contenido no se modificó.",
        network: "No se pudo conectar con DeepL. El contenido no se modificó.",
      };
      return { ok: false, message: map[err.code] ?? err.message };
    }
    console.error("translateVehicleToEnglish unexpected error:", err);
    return { ok: false, message: "Error inesperado al traducir. El contenido no se modificó." };
  }
}
