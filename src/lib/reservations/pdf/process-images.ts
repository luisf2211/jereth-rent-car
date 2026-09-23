import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

/**
 * Premium image treatment for the confirmation PDF.
 *
 * @react-pdf/renderer can't do gradients, masks or blur over images, so we
 * bake the treatment into PNGs on the server with sharp: panoramic crop,
 * darkening, and gradient fades to black (+ a subtle magenta accent) so the
 * photos blend into the black header / footer instead of looking like
 * rectangular stickers. The result is a data URI ready to drop into the PDF.
 *
 * The two source photos live in public/pdf/. Missing files degrade to null so
 * the PDF still renders (with a plain black band).
 */

const BLACK = { r: 11, g: 11, b: 12 };
const MAGENTA = "#EC0F8D";

async function readPublic(rel: string): Promise<Buffer | null> {
  try {
    return await readFile(path.join(process.cwd(), "public", rel));
  } catch {
    return null;
  }
}

function toDataUri(buf: Buffer): string {
  return `data:image/png;base64,${buf.toString("base64")}`;
}

/**
 * Header banner: a panoramic strip that fades from solid black on the LEFT
 * (where it meets the title) into the darkened photo on the right, with a thin
 * magenta light-leak along the bottom. Rendered at 2x for crispness.
 */
export async function buildHeaderBanner(): Promise<string | null> {
  const src = await readPublic("pdf/header-airport.jpg");
  if (!src) return null;
  const W = 640;
  const H = 260;

  // Panoramic cover-crop of the photo, slightly darkened.
  const photo = await sharp(src)
    .resize(W, H, { fit: "cover", position: "attention" })
    .modulate({ brightness: 0.82, saturation: 1.05 })
    .toBuffer();

  // Left-to-right fade to black + bottom vignette + magenta light-leak.
  const overlay = Buffer.from(
    `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="lr" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="rgb(11,11,12)" stop-opacity="1"/>
          <stop offset="0.42" stop-color="rgb(11,11,12)" stop-opacity="0.55"/>
          <stop offset="1" stop-color="rgb(11,11,12)" stop-opacity="0.12"/>
        </linearGradient>
        <linearGradient id="tb" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="rgb(11,11,12)" stop-opacity="0.55"/>
          <stop offset="0.4" stop-color="rgb(11,11,12)" stop-opacity="0"/>
          <stop offset="0.82" stop-color="rgb(11,11,12)" stop-opacity="0"/>
          <stop offset="1" stop-color="rgb(11,11,12)" stop-opacity="0.7"/>
        </linearGradient>
      </defs>
      <rect width="${W}" height="${H}" fill="url(#lr)"/>
      <rect width="${W}" height="${H}" fill="url(#tb)"/>
      <rect x="0" y="${H - 4}" width="${W}" height="4" fill="${MAGENTA}" opacity="0.9"/>
    </svg>`
  );

  const out = await sharp(photo)
    .composite([{ input: overlay, blend: "over" }])
    .png()
    .toBuffer();
  return toDataUri(out);
}

/**
 * Footer/section banner: a wide panoramic strip fading to black on the LEFT
 * (behind the "Tu destino, nuestro compromiso" text) and softly at the edges,
 * with a magenta accent line on top. Used in the conditions row.
 */
export async function buildSantoDomingoBanner(): Promise<string | null> {
  const src = await readPublic("pdf/footer-santodomingo.jpg");
  if (!src) return null;
  const W = 520;
  const H = 220;

  const photo = await sharp(src)
    .resize(W, H, { fit: "cover", position: "attention" })
    .modulate({ brightness: 0.8, saturation: 1.05 })
    .toBuffer();

  const overlay = Buffer.from(
    `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="lr" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="rgb(11,11,12)" stop-opacity="0.92"/>
          <stop offset="0.5" stop-color="rgb(11,11,12)" stop-opacity="0.35"/>
          <stop offset="1" stop-color="rgb(11,11,12)" stop-opacity="0.1"/>
        </linearGradient>
        <linearGradient id="edge" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="rgb(11,11,12)" stop-opacity="0.35"/>
          <stop offset="0.5" stop-color="rgb(11,11,12)" stop-opacity="0"/>
          <stop offset="1" stop-color="rgb(11,11,12)" stop-opacity="0.35"/>
        </linearGradient>
      </defs>
      <rect width="${W}" height="${H}" fill="url(#lr)"/>
      <rect width="${W}" height="${H}" fill="url(#edge)"/>
      <rect x="0" y="0" width="${W}" height="3" fill="${MAGENTA}" opacity="0.9"/>
    </svg>`
  );

  const out = await sharp(photo)
    .composite([{ input: overlay, blend: "over" }])
    .png()
    .toBuffer();
  return toDataUri(out);
}

/**
 * Vehicle HERO panel: the real car photo, trimmed of surrounding whitespace,
 * placed CONTAIN (whole car visible, front-to-back, never cropped/zoomed) and
 * centered over an elegant dark radial-ish gradient panel with a subtle
 * magenta glow and a soft floor shadow. The car becomes the protagonist while
 * the leftover space blends into the design instead of looking pasted.
 *
 * Works for any vehicle automatically. Returns a data URI, or null on failure.
 */
export async function buildVehicleHero(remoteUrl: string): Promise<string | null> {
  try {
    const res = await fetch(remoteUrl);
    if (!res.ok) return null;
    const srcBuf = Buffer.from(await res.arrayBuffer());

    const W = 900;
    const H = 460;

    // Trim near-uniform borders (many catalog photos have white margins), then
    // fit the whole car inside ~86% of the panel so there is tasteful air.
    let car: Buffer;
    try {
      car = await sharp(srcBuf).trim({ threshold: 12 }).toBuffer();
    } catch {
      car = srcBuf;
    }
    const carLayer = await sharp(car)
      .resize(Math.round(W * 0.86), Math.round(H * 0.8), { fit: "inside", withoutEnlargement: false })
      .toBuffer();

    // Dark premium background with a centered magenta glow + vignette.
    const bg = Buffer.from(
      `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <radialGradient id="glow" cx="50%" cy="42%" r="62%">
            <stop offset="0" stop-color="#2A1020" stop-opacity="1"/>
            <stop offset="0.45" stop-color="#141416" stop-opacity="1"/>
            <stop offset="1" stop-color="#0B0B0C" stop-opacity="1"/>
          </radialGradient>
          <radialGradient id="mag" cx="50%" cy="46%" r="46%">
            <stop offset="0" stop-color="${MAGENTA}" stop-opacity="0.28"/>
            <stop offset="1" stop-color="${MAGENTA}" stop-opacity="0"/>
          </radialGradient>
          <radialGradient id="floor" cx="50%" cy="86%" r="34%">
            <stop offset="0" stop-color="#000000" stop-opacity="0.55"/>
            <stop offset="1" stop-color="#000000" stop-opacity="0"/>
          </radialGradient>
        </defs>
        <rect width="${W}" height="${H}" fill="url(#glow)"/>
        <rect width="${W}" height="${H}" fill="url(#mag)"/>
        <ellipse cx="${W / 2}" cy="${H * 0.9}" rx="${W * 0.32}" ry="18" fill="url(#floor)"/>
        <rect x="0" y="${H - 3}" width="${W}" height="3" fill="${MAGENTA}" opacity="0.85"/>
      </svg>`
    );

    const meta = await sharp(carLayer).metadata();
    const left = Math.round((W - (meta.width ?? 0)) / 2);
    const top = Math.round((H - (meta.height ?? 0)) / 2) - 6; // nudge up for floor shadow

    const out = await sharp(bg)
      .composite([{ input: carLayer, left: Math.max(0, left), top: Math.max(0, top) }])
      .png()
      .toBuffer();
    return toDataUri(out);
  } catch {
    return null;
  }
}

/** Both processed banners (null-safe). */
export async function buildPdfBanners(): Promise<{ header: string | null; footer: string | null }> {
  const [header, footer] = await Promise.all([buildHeaderBanner(), buildSantoDomingoBanner()]);
  return { header, footer };
}

// keep BLACK referenced (documents intended blend target)
void BLACK;
