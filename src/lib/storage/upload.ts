import "server-only";
import { createAdminClient } from "@/utils/supabase/admin";
import { optimizeImageBuffer } from "@/lib/storage/optimize-image";

/**
 * Cache-Control for PUBLIC, immutable objects. Every public upload gets a
 * fresh random UUID filename and is never overwritten (upsert:false), so a
 * given URL's bytes never change. That makes a 1-year immutable cache SAFE:
 * when an admin "changes" a photo, a NEW url is produced, so the browser/CDN
 * fetches the new object instead of serving a stale cached one.
 *
 * Supabase emits `cache-control: public, max-age=<cacheControl>`. We request
 * one year (31536000s). This is the single biggest lever against the repeated
 * "cached egress" caused by the previous 1-hour default re-downloading originals.
 */
const PUBLIC_IMMUTABLE_CACHE_CONTROL = "31536000";

/**
 * Domain folders inside the central Storage bucket. Add new ones here as the
 * app grows (clients face photos, vehicle handover photos, etc.).
 */
export const STORAGE_FOLDERS = {
  branding: "branding",
  vehicles: "vehicles",
  clients: "clients",
  handover: "handover",
  // Official reservation confirmation PDFs.
  confirmations: "confirmations",
} as const;

export type StorageFolder = (typeof STORAGE_FOLDERS)[keyof typeof STORAGE_FOLDERS];

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "media";

/**
 * Separate PRIVATE bucket for sensitive client documents (payment proofs,
 * flight itineraries, reservation confirmation PDFs). Never public: objects
 * here are served only through short-lived signed URLs minted server-side.
 * Provisioned by the migration `*_private_client_docs_bucket`.
 */
const PRIVATE_BUCKET = process.env.SUPABASE_PRIVATE_BUCKET || "client-docs";

/**
 * Prefix stored in DB columns for objects that live in the PRIVATE bucket.
 * A stored value is either:
 *   - a legacy PUBLIC url  ("https://.../storage/v1/object/public/media/...")
 *   - a private ref        ("priv:<path-inside-private-bucket>")
 * This lets new uploads be private while historical public URLs keep working
 * unchanged (backward compatible).
 */
export const PRIVATE_REF_PREFIX = "priv:";

/** Default lifetime (seconds) for signed URLs generated for private docs. */
export const SIGNED_URL_TTL_SECONDS = 60 * 10; // 10 minutes

const ALLOWED_MIME = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const MAX_BYTES = 5 * 1024 * 1024; // 5MB

export interface UploadResult {
  ok: boolean;
  url?: string;
  path?: string;
  error?: string;
}

function extensionFor(mime: string): string {
  switch (mime) {
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "image/gif":
      return "gif";
    default:
      return "jpg";
  }
}

/**
 * Uploads an image to `<bucket>/<folder>/<random>.<ext>` and returns its
 * public URL. Server-only (uses the service role client). Reusable across
 * branding, vehicles, clients and handover photos.
 */
export async function uploadImage(folder: StorageFolder, file: File): Promise<UploadResult> {
  if (!ALLOWED_MIME.includes(file.type)) {
    return { ok: false, error: "Formato no permitido. Usa PNG, JPG, WEBP o GIF." };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "La imagen supera el máximo de 5MB." };
  }

  const supabase = createAdminClient();

  // Quality-first optimization: downscale only when huge, re-encode to
  // high-quality WebP, preserve transparency, and fall back to the original
  // bytes if optimization didn't help. GIFs/animated images pass through
  // untouched. See optimize-image.ts.
  const original = Buffer.from(await file.arrayBuffer());
  const opt = await optimizeImageBuffer(original, file.type);

  const filename = `${crypto.randomUUID()}.${opt.ext}`;
  const path = `${folder}/${filename}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, opt.data, {
      contentType: opt.contentType,
      upsert: false,
      cacheControl: PUBLIC_IMMUTABLE_CACHE_CONTROL,
    });

  if (error) {
    console.error("uploadImage failed:", error);
    return { ok: false, error: "No se pudo subir la imagen." };
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { ok: true, url: data.publicUrl, path };
}


/**
 * Uploads a document (image OR PDF) to the same Storage bucket/folders as
 * uploadImage. Used for flight itineraries, which may be a photo, screenshot
 * or PDF ticket. Reuses the existing storage infrastructure.
 */
const ALLOWED_DOC_MIME = [...ALLOWED_MIME, "application/pdf"];

export async function uploadDocument(folder: StorageFolder, file: File): Promise<UploadResult> {
  if (!ALLOWED_DOC_MIME.includes(file.type)) {
    return { ok: false, error: "Formato no permitido. Usa PNG, JPG, WEBP, GIF o PDF." };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "El archivo supera el máximo de 5MB." };
  }

  const supabase = createAdminClient();

  // Images get the same quality-first optimization; PDFs pass through
  // untouched (we only add the long cache). optimizeImageBuffer is a no-op for
  // non-image mimes, so this is safe for PDFs.
  const original = Buffer.from(await file.arrayBuffer());
  const opt = await optimizeImageBuffer(original, file.type);
  const ext = file.type === "application/pdf" ? "pdf" : opt.ext;
  const filename = `${crypto.randomUUID()}.${ext}`;
  const path = `${folder}/${filename}`;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, opt.data, {
      contentType: opt.contentType,
      upsert: false,
      cacheControl: PUBLIC_IMMUTABLE_CACHE_CONTROL,
    });

  if (error) {
    console.error("uploadDocument failed:", error);
    return { ok: false, error: "No se pudo subir el archivo." };
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { ok: true, url: data.publicUrl, path };
}


/**
 * Uploads a raw binary buffer (e.g. a generated PDF) to Storage and returns
 * its public URL. Unlike uploadImage/uploadDocument, this does not take a File
 * — it's for server-generated content. The caller controls the exact path so
 * regeneration is idempotent (upsert overwrites the same object instead of
 * accumulating orphans).
 *
 * The path is NOT derived from user input (we pass a reservation code/uuid),
 * so one reservation's PDF can never collide with or expose another's.
 */
export interface UploadBufferOptions {
  /** Object path relative to the bucket, e.g. "confirmations/JRC-ABCDEF.pdf". */
  path: string;
  contentType: string;
  /** Overwrite an existing object at the same path (default true). */
  upsert?: boolean;
}

export async function uploadBuffer(
  bytes: Uint8Array | ArrayBuffer,
  { path, contentType, upsert = true }: UploadBufferOptions
): Promise<UploadResult> {
  const supabase = createAdminClient();

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType, upsert });

  if (error) {
    console.error("uploadBuffer failed:", error);
    return { ok: false, error: "No se pudo guardar el archivo generado." };
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { ok: true, url: data.publicUrl, path };
}


/* ===========================================================================
 * PRIVATE client documents (payment proofs, itineraries, confirmation PDFs)
 * ---------------------------------------------------------------------------
 * These live in the PRIVATE bucket and are NEVER given a permanent public URL.
 * Uploads return a private ref ("priv:<path>") to be stored in DB. Reads go
 * through resolvePrivateUrl(), which mints a short-lived signed URL on demand.
 * All of this is server-only (service_role); the browser only ever receives
 * an already-signed, expiring URL.
 * =========================================================================== */

/** True when a stored DB value points to the PRIVATE bucket (new documents). */
export function isPrivateRef(value: string | null | undefined): value is string {
  return typeof value === "string" && value.startsWith(PRIVATE_REF_PREFIX);
}

/** Extract the object path inside the private bucket from a "priv:<path>" ref. */
function privatePathOf(ref: string): string {
  return ref.slice(PRIVATE_REF_PREFIX.length);
}

/**
 * Uploads a sensitive IMAGE to the PRIVATE bucket. Returns a private ref
 * ("priv:<path>") — NOT a public URL. Same validation as uploadImage.
 */
export async function uploadPrivateImage(folder: StorageFolder, file: File): Promise<UploadResult> {
  if (!ALLOWED_MIME.includes(file.type)) {
    return { ok: false, error: "Formato no permitido. Usa PNG, JPG, WEBP o GIF." };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "La imagen supera el máximo de 5MB." };
  }
  return uploadPrivateFile(folder, file, extensionFor(file.type));
}

/**
 * Uploads a sensitive DOCUMENT (image OR PDF) to the PRIVATE bucket. Returns a
 * private ref ("priv:<path>"). Same validation as uploadDocument.
 */
export async function uploadPrivateDocument(folder: StorageFolder, file: File): Promise<UploadResult> {
  if (!ALLOWED_DOC_MIME.includes(file.type)) {
    return { ok: false, error: "Formato no permitido. Usa PNG, JPG, WEBP, GIF o PDF." };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "El archivo supera el máximo de 5MB." };
  }
  const ext = file.type === "application/pdf" ? "pdf" : extensionFor(file.type);
  return uploadPrivateFile(folder, file, ext);
}

/** Shared private upload: random filename, no public URL, returns "priv:<path>". */
async function uploadPrivateFile(folder: StorageFolder, file: File, ext: string): Promise<UploadResult> {
  const supabase = createAdminClient();
  const filename = `${crypto.randomUUID()}.${ext}`;
  const path = `${folder}/${filename}`;
  const arrayBuffer = await file.arrayBuffer();

  const { error } = await supabase.storage
    .from(PRIVATE_BUCKET)
    .upload(path, arrayBuffer, { contentType: file.type, upsert: false });

  if (error) {
    console.error("uploadPrivateFile failed:", error);
    return { ok: false, error: "No se pudo subir el archivo." };
  }
  return { ok: true, url: `${PRIVATE_REF_PREFIX}${path}`, path };
}

/**
 * Uploads a server-generated BUFFER (e.g. the confirmation PDF) to the PRIVATE
 * bucket at a caller-controlled path. Returns a private ref ("priv:<path>").
 * Regeneration is idempotent (upsert overwrites the same object).
 */
export async function uploadPrivateBuffer(
  bytes: Uint8Array | ArrayBuffer,
  { path, contentType, upsert = true }: UploadBufferOptions
): Promise<UploadResult> {
  const supabase = createAdminClient();
  const { error } = await supabase.storage
    .from(PRIVATE_BUCKET)
    .upload(path, bytes, { contentType, upsert });

  if (error) {
    console.error("uploadPrivateBuffer failed:", error);
    return { ok: false, error: "No se pudo guardar el archivo generado." };
  }
  return { ok: true, url: `${PRIVATE_REF_PREFIX}${path}`, path };
}

/**
 * Resolves a stored document value into a URL usable by the browser:
 *   - private ref ("priv:<path>") → a short-lived SIGNED URL (server-side).
 *   - legacy public URL           → returned unchanged (backward compatible).
 *   - null/empty                  → null.
 *
 * Signed-URL generation degrades gracefully: on any error it returns null so a
 * missing/expired document never throws in a page render.
 */
export async function resolvePrivateUrl(
  value: string | null | undefined,
  ttlSeconds: number = SIGNED_URL_TTL_SECONDS
): Promise<string | null> {
  if (!value) return null;
  if (!isPrivateRef(value)) return value; // legacy public URL — leave as-is.

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.storage
      .from(PRIVATE_BUCKET)
      .createSignedUrl(privatePathOf(value), ttlSeconds);
    if (error || !data?.signedUrl) {
      console.error("resolvePrivateUrl failed:", error);
      return null;
    }
    return data.signedUrl;
  } catch (e) {
    console.error("resolvePrivateUrl threw:", e);
    return null;
  }
}
