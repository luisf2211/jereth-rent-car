"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { requirePermission } from "@/lib/auth/current-user";
import { vehicleSchema } from "@/lib/validations/vehicle";
import type { ActionResult } from "@/lib/actions/result";

function fieldErrorsFrom(error: z.ZodError): Record<string, string> {
  const flat = z.flattenError(error).fieldErrors as Record<string, string[] | undefined>;
  const out: Record<string, string> = {};
  for (const [key, msgs] of Object.entries(flat)) {
    if (msgs && msgs.length) out[key] = msgs[0]!;
  }
  return out;
}

function revalidateVehiclePaths(id?: string) {
  revalidatePath("/admin/vehicles");
  revalidatePath("/", "layout"); // public catalog + featured
  // The public detail URL is now "/vehicles/<slug>-<cuid>", so the slug can
  // change on rename. Revalidate the dynamic route itself (covers every slug
  // variant) instead of a single concrete path.
  revalidatePath("/vehicles/[id]", "page");
  // Best-effort: also revalidate a legacy bare-cuid path if one was cached.
  if (id) revalidatePath(`/vehicles/${id}`);
}

export async function createVehicle(input: unknown): Promise<ActionResult> {
  try {
    await requirePermission("vehicles.create");
  } catch {
    return { ok: false, message: "No tienes permiso para crear vehículos." };
  }

  const parsed = vehicleSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Revisa los campos.", fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  const data = {
    ...parsed.data,
    description: parsed.data.description || null,
    whatsappMessage: parsed.data.whatsappMessage || null,
    carouselImageUrl: parsed.data.carouselImageUrl || null,
    documentImageUrl: parsed.data.documentImageUrl || null,
    // imageFits: store as-is (Prisma Json field). Empty object means no custom framing.
    imageFits: Object.keys(parsed.data.imageFits ?? {}).length > 0
      ? (parsed.data.imageFits as Prisma.InputJsonValue)
      : Prisma.JsonNull,
  };
  try {
    await prisma.vehicle.create({ data });
  } catch (error) {
    console.error("createVehicle failed:", error);
    return { ok: false, message: "No se pudo crear el vehículo." };
  }

  revalidateVehiclePaths();
  return { ok: true, message: "Vehículo creado." };
}

export async function updateVehicle(id: string, input: unknown): Promise<ActionResult> {
  try {
    await requirePermission("vehicles.edit");
  } catch {
    return { ok: false, message: "No tienes permiso para editar vehículos." };
  }

  const parsed = vehicleSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Revisa los campos.", fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  const data = {
    ...parsed.data,
    description: parsed.data.description || null,
    whatsappMessage: parsed.data.whatsappMessage || null,
    carouselImageUrl: parsed.data.carouselImageUrl || null,
    documentImageUrl: parsed.data.documentImageUrl || null,
    imageFits: Object.keys(parsed.data.imageFits ?? {}).length > 0
      ? (parsed.data.imageFits as Prisma.InputJsonValue)
      : Prisma.JsonNull,
  };
  try {
    await prisma.vehicle.update({ where: { id }, data });
  } catch (error) {
    console.error("updateVehicle failed:", error);
    return { ok: false, message: "No se pudo actualizar el vehículo." };
  }

  revalidateVehiclePaths(id);
  return { ok: true, message: "Vehículo actualizado." };
}

export async function toggleVehicleActive(id: string, isActive: boolean): Promise<ActionResult> {
  try {
    await requirePermission("vehicles.disable");
  } catch {
    return { ok: false, message: "No tienes permiso para esta acción." };
  }

  try {
    await prisma.vehicle.update({ where: { id }, data: { isActive } });
  } catch (error) {
    console.error("toggleVehicleActive failed:", error);
    return { ok: false, message: "No se pudo actualizar el estado." };
  }

  revalidateVehiclePaths(id);
  return { ok: true, message: isActive ? "Vehículo publicado." : "Vehículo ocultado." };
}

export async function deleteVehicle(id: string): Promise<ActionResult> {
  try {
    await requirePermission("vehicles.disable");
  } catch {
    return { ok: false, message: "No tienes permiso para eliminar vehículos." };
  }

  try {
    await prisma.vehicle.delete({ where: { id } });
  } catch (error) {
    // A vehicle that already has reservations can't be hard-deleted because of
    // the Reservation.vehicleId foreign key. Guide the admin to hide it instead
    // of losing reservation history.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
      return {
        ok: false,
        message:
          "No se puede eliminar: el vehículo tiene reservas asociadas. Ocúltalo en su lugar para conservar el historial.",
      };
    }
    console.error("deleteVehicle failed:", error);
    return { ok: false, message: "No se pudo eliminar el vehículo." };
  }

  revalidateVehiclePaths(id);
  return { ok: true, message: "Vehículo eliminado." };
}

export async function uploadVehicleImage(
  formData: FormData
): Promise<{ ok: true; url: string } | { ok: false; message: string }> {
  try {
    await requirePermission("vehicles.edit");
  } catch {
    return { ok: false, message: "No tienes permiso para subir imágenes." };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Selecciona una imagen." };
  }

  const { uploadImage, STORAGE_FOLDERS } = await import("@/lib/storage/upload");
  const res = await uploadImage(STORAGE_FOLDERS.vehicles, file);
  if (!res.ok || !res.url) {
    return { ok: false, message: res.error ?? "No se pudo subir la imagen." };
  }
  return { ok: true, url: res.url };
}
