import "server-only";
import sharp from "sharp";

/**
 * Server-side image optimization for PUBLIC uploads (vehicles, branding,
 * delivery locations, content photos).
 *
 * GOAL: cut Supabase Storage egress WITHOUT visible quality loss. Priority is
 * ALWAYS visual quality over raw byte savings — a crisp 300 KB photo beats a
 * blurry 80 KB one.
 *
 * Strategy (quality-first):
 *  - Only downscale when the longest side exceeds a generous ceiling
 *    (DEFAULT 2560px), so retina / large-screen / fullscreen gallery viewing
 *    stays sharp. Photos smaller than that keep their native resolution.
 *  - Re-encode to WebP at high quality (90 for opaque photos, 95 for images
 *    that carry transparency, e.g. logos) so there are no visible artifacts.
 *  - Preserve transparency: images with an alpha channel are NEVER flattened.
 *  - Never upsize. Never strip to a format that hurts the image.
 *  - FAIL-SAFE: if anything goes wrong, or if the "optimized" output ends up
 *    NOT smaller than the original, we keep the ORIGINAL bytes untouched. The
 *    upload never breaks because of optimization.
 *
 * This module only transforms bytes in memory; it does not touch Storage, the
 * DB, or any existing object. Callers decide where to store the result.
 */

/** Longest-side ceiling in px. Generous on purpose (retina / fullscreen). */
export const MAX_LONG_EDGE = 2560;

/** WebP quality for opaque photographs (high — no perceptible loss). */
export const PHOTO_WEBP_QUALITY = 90;

/** WebP quality for images with transparency (logos/marks) — extra headroom. */
export const ALPHA_WEBP_QUALITY = 95;

export interface OptimizeResult {
  /** The bytes to store (optimized when it helped, original otherwise). */
  data: Buffer;
  /** Final content type to store with the object. */
  contentType: string;
  /** File extension (no dot) matching contentType. */
  ext: string;
  /** Whether optimization actually changed the bytes. */
  optimized: boolean;
  /** Diagnostics (sizes/dimensions) — handy for logging/measurement. */
  info: {
    originalBytes: number;
    outputBytes: number;
    width?: number;
    height?: number;
    outWidth?: number;
    outHeight?: number;
    hadAlpha: boolean;
    resized: boolean;
    reason?: string;
  };
}

/** Extensions we treat as optimizable raster photos. GIF is excluded (may be animated). */
const OPTIMIZABLE = new Set(["image/png", "image/jpeg", "image/webp"]);

/**
 * Optimize a raw image buffer. `mime` is the uploaded file's content type.
 *
 * Returns the bytes to actually store plus the resolved content type / ext.
 * For GIFs or on any failure, returns the original bytes with the original
 * content type (no-op), so animated GIFs and edge cases are never degraded.
 */
export async function optimizeImageBuffer(
  input: Buffer,
  mime: string,
  opts?: { maxLongEdge?: number }
): Promise<OptimizeResult> {
  const originalBytes = input.byteLength;
  const maxLongEdge = opts?.maxLongEdge ?? MAX_LONG_EDGE;

  // GIF (possibly animated) or unknown types: never touch.
  if (!OPTIMIZABLE.has(mime)) {
    return {
      data: input,
      contentType: mime,
      ext: extFromMime(mime),
      optimized: false,
      info: { originalBytes, outputBytes: originalBytes, hadAlpha: false, resized: false, reason: "non-optimizable mime" },
    };
  }

  try {
    const img = sharp(input, { failOn: "none" });
    const meta = await img.metadata();

    // Animated images (animated WebP/PNG): don't risk flattening frames.
    if (meta.pages && meta.pages > 1) {
      return {
        data: input,
        contentType: mime,
        ext: extFromMime(mime),
        optimized: false,
        info: { originalBytes, outputBytes: originalBytes, hadAlpha: !!meta.hasAlpha, resized: false, reason: "animated image" },
      };
    }

    const width = meta.width ?? undefined;
    const height = meta.height ?? undefined;
    const hadAlpha = !!meta.hasAlpha;
    const longEdge = Math.max(width ?? 0, height ?? 0);
    const needsResize = longEdge > maxLongEdge;

    let pipeline = sharp(input, { failOn: "none" }).rotate(); // honor EXIF orientation

    if (needsResize) {
      pipeline = pipeline.resize({
        width: (width ?? 0) >= (height ?? 0) ? maxLongEdge : undefined,
        height: (height ?? 0) > (width ?? 0) ? maxLongEdge : undefined,
        fit: "inside",
        withoutEnlargement: true,
      });
    }

    // High-quality WebP. Keep alpha; use near-lossless-ish quality for alpha
    // images (logos) so edges stay crisp. effort:5 is a good size/time balance.
    const webpQuality = hadAlpha ? ALPHA_WEBP_QUALITY : PHOTO_WEBP_QUALITY;
    const outBuf = await pipeline
      .webp({ quality: webpQuality, alphaQuality: 100, effort: 5 })
      .toBuffer({ resolveWithObject: true });

    const outputBytes = outBuf.data.byteLength;

    // Quality-first guard: only accept the optimized output if it is actually
    // smaller than the original. If re-encoding made it bigger (rare, e.g. an
    // already-tiny WebP), keep the original untouched.
    if (outputBytes >= originalBytes) {
      return {
        data: input,
        contentType: mime,
        ext: extFromMime(mime),
        optimized: false,
        info: {
          originalBytes,
          outputBytes: originalBytes,
          width,
          height,
          hadAlpha,
          resized: false,
          reason: "optimized not smaller — kept original",
        },
      };
    }

    return {
      data: outBuf.data,
      contentType: "image/webp",
      ext: "webp",
      optimized: true,
      info: {
        originalBytes,
        outputBytes,
        width,
        height,
        outWidth: outBuf.info.width,
        outHeight: outBuf.info.height,
        hadAlpha,
        resized: needsResize,
      },
    };
  } catch (e) {
    // FAIL-SAFE: never break an upload because optimization failed.
    console.error("optimizeImageBuffer failed, storing original:", e);
    return {
      data: input,
      contentType: mime,
      ext: extFromMime(mime),
      optimized: false,
      info: { originalBytes, outputBytes: originalBytes, hadAlpha: false, resized: false, reason: "exception — kept original" },
    };
  }
}

function extFromMime(mime: string): string {
  switch (mime) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    case "application/pdf":
      return "pdf";
    default:
      return "jpg";
  }
}
