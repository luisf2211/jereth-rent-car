import "server-only";
import { Resend } from "resend";

/**
 * Server-only Resend client.
 *
 * The API key lives ONLY in the RESEND_API_KEY environment variable (never
 * hardcoded, never prefixed with NEXT_PUBLIC_, so it never reaches the
 * browser bundle). This module is `server-only`, so importing it from a
 * Client Component is a build error.
 *
 * The email flows (reservation notifications, PDF, etc.) are NOT implemented
 * yet — this file only prepares a safe, reusable client for the next phase.
 */

/** From address for outgoing mail. Uses the verified domain jerethrentcar.com.
 *  Overridable via RESEND_FROM_EMAIL without code changes. */
export const RESEND_FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || "JERETH RENT CAR <reservas@jerethrentcar.com>";

/** True when the API key is present in the environment. Lets callers degrade
 *  gracefully (e.g. skip sending) instead of throwing when email isn't set up. */
export function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

/** The production public site (used for absolute links in emails). */
const PRODUCTION_SITE_URL = "https://www.jerethrentcar.com";

/**
 * Single source of truth for the absolute base URL used to build links in ALL
 * reservation emails ("Ver mi reserva", "Corregir información", "Descargar
 * confirmación PDF", "Revisar reserva").
 *
 * Resolution order:
 *  1. NEXT_PUBLIC_SITE_URL — explicit override (respected when set).
 *  2. In production (Vercel prod or NODE_ENV=production) → the real domain,
 *     so emails never leak http://localhost even if the env var is unset.
 *  3. Local dev fallback → http://localhost:3000.
 *
 * Only the BASE changes; routes/tokens/params are appended by the callers and
 * are never touched here.
 */
export function emailBaseUrl(): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicit) return explicit.replace(/\/$/, "");
  const isProd = process.env.VERCEL_ENV === "production" || process.env.NODE_ENV === "production";
  if (isProd) return PRODUCTION_SITE_URL;
  return "http://localhost:3000";
}

// Cached singleton across hot-reloads / lambda invocations.
const globalForResend = globalThis as unknown as { resend?: Resend };

/**
 * Returns the shared Resend client. Throws a clear error when the key is
 * missing so misconfiguration is obvious in server logs (the key value itself
 * is never logged).
 */
export function getResendClient(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("Falta RESEND_API_KEY en el entorno.");
  }
  const client = globalForResend.resend ?? new Resend(apiKey);
  if (process.env.NODE_ENV !== "production") {
    globalForResend.resend = client;
  }
  return client;
}
