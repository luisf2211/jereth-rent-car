import "server-only";
import { createAdminClient } from "@/utils/supabase/admin";

/**
 * Domain folders inside the central Storage bucket. Add new ones here as the
 * app grows (clients face photos, vehicle handover photos, etc.).
 */
export const STORAGE_FOLDERS = {
  branding: "branding",
  vehicles: "vehicles",
  clients: "clients",
  handover: "handover",
} as const;

export type StorageFolder = (typeof STORAGE_FOLDERS)[keyof typeof STORAGE_FOLDERS];

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "media";

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
  const ext = extensionFor(file.type);
  const filename = `${crypto.randomUUID()}.${ext}`;
  const path = `${folder}/${filename}`;

  const arrayBuffer = await file.arrayBuffer();

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, arrayBuffer, { contentType: file.type, upsert: false });

  if (error) {
    console.error("uploadImage failed:", error);
    return { ok: false, error: "No se pudo subir la imagen." };
  }

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { ok: true, url: data.publicUrl, path };
}
