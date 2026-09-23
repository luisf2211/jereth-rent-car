import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";

/**
 * Image loading helpers for the confirmation PDF.
 *
 * @react-pdf/renderer can take a remote URL directly, but a network hiccup at
 * render time would break the whole document. So we pre-fetch remote images
 * (logo, vehicle photo) into data URIs and read local assets from disk. All
 * failures are non-fatal: a missing image returns null and the PDF renders
 * with a graceful fallback instead of throwing.
 */

/** Fetch a remote image and return a data URI, or null on any failure. */
export async function remoteImageToDataUri(url: string | null | undefined): Promise<string | null> {
  if (!url) return null;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const contentType = res.headers.get("content-type") || "image/png";
    const buf = Buffer.from(await res.arrayBuffer());
    return `data:${contentType};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

/** Read a local file under /public and return a data URI, or null. */
export async function localImageToDataUri(publicRelPath: string, mime: string): Promise<string | null> {
  try {
    const abs = path.join(process.cwd(), "public", publicRelPath);
    const buf = await readFile(abs);
    return `data:${mime};base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

/** The two owner-approved decorative assets (placed in public/pdf/). */
export async function loadPdfDecorAssets(): Promise<{ airport: string | null; santoDomingo: string | null }> {
  const [airport, santoDomingo] = await Promise.all([
    localImageToDataUri("pdf/header-airport.jpg", "image/jpeg"),
    localImageToDataUri("pdf/footer-santodomingo.jpg", "image/jpeg"),
  ]);
  return { airport, santoDomingo };
}
