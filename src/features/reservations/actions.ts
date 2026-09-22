"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/current-user";
import {
  createReservationLinkSchema,
  customerReservationSchema,
  reservationSettingsSchema,
  RESERVATION_STATUSES,
  type ReservationStatus,
} from "@/lib/validations/reservation";
import { rentalDays } from "@/utils/rental-days";
import type { ActionResult } from "@/lib/actions/result";

function fieldErrorsFrom(error: z.ZodError): Record<string, string> {
  const flat = z.flattenError(error).fieldErrors as Record<string, string[] | undefined>;
  const out: Record<string, string> = {};
  for (const [key, msgs] of Object.entries(flat)) {
    if (msgs && msgs.length) out[key] = msgs[0]!;
  }
  return out;
}

/** Parse a YYYY-MM-DD string into a Date, or null when empty/invalid. */
function parseDate(value: string | undefined): Date | null {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Human-friendly reservation code, e.g. "JRC-8F3K2A". */
function generateCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no ambiguous chars
  let s = "";
  for (let i = 0; i < 6; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
  return `JRC-${s}`;
}

/** Cryptographically strong token for the shareable link. */
function generateToken(): string {
  // Two UUIDs (no dashes) = 64 hex chars, plenty of entropy and URL-safe.
  return (crypto.randomUUID() + crypto.randomUUID()).replace(/-/g, "");
}

function revalidateReservations(token?: string) {
  revalidatePath("/admin/reservations");
  if (token) revalidatePath(`/reservar/${token}`);
}

/* ------------------------- Create reservation link ------------------------ */

/**
 * Creates a reservation LINK. Only the vehicle is required; the rest is
 * optional pre-fill. This does NOT block the vehicle nor confirm anything —
 * the reservation starts in "link_created" and the customer completes the
 * digital form from the returned URL.
 */
export async function createReservationLink(
  input: unknown
): Promise<
  | { ok: true; message?: string; token: string; code: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string> }
> {
  try {
    await requirePermission("reservations.edit");
  } catch {
    return { ok: false, message: "No tienes permiso para crear reservas." };
  }

  const parsed = createReservationLinkSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Revisa los campos.", fieldErrors: fieldErrorsFrom(parsed.error) };
  }
  const d = parsed.data;

  // Guard: the vehicle must exist.
  const vehicle = await prisma.vehicle.findUnique({ where: { id: d.vehicleId } });
  if (!vehicle) {
    return { ok: false, message: "El vehículo seleccionado no existe.", fieldErrors: { vehicleId: "Vehículo inválido" } };
  }

  // If both dates are pre-filled, compute an estimate now (still editable by
  // the customer). Otherwise leave it at 0 until they fill the form.
  const billedDays =
    d.pickupDate && d.dropoffDate
      ? rentalDays({
          pickupDate: d.pickupDate,
          dropoffDate: d.dropoffDate,
          pickupTime: d.pickupTime || undefined,
          dropoffTime: d.dropoffTime || undefined,
        })
      : 0;
  const dailyPrice = d.dailyPrice || vehicle.dailyPrice;
  const estimatedTotal = billedDays * dailyPrice;

  const token = generateToken();
  const code = generateCode();

  try {
    await prisma.reservation.create({
      data: {
        code,
        token,
        vehicleId: d.vehicleId,
        source: d.source,
        status: "link_created",
        pickupDate: parseDate(d.pickupDate),
        pickupTime: d.pickupTime || null,
        dropoffDate: parseDate(d.dropoffDate),
        dropoffTime: d.dropoffTime || null,
        pickupLocation: d.pickupLocation || null,
        dropoffLocation: d.dropoffLocation || null,
        dailyPrice,
        billedDays,
        estimatedTotal,
        reservationDeposit: d.reservationDeposit || 0,
      },
    });
  } catch (error) {
    console.error("createReservationLink failed:", error);
    return { ok: false, message: "No se pudo crear el enlace de reserva." };
  }

  revalidateReservations(token);
  return { ok: true, message: "Enlace de reserva creado.", token, code };
}

/* --------------------- Submit the digital reservation --------------------- */

/**
 * Saves the CUSTOMER's submission of the digital form (from the link). Moves
 * the reservation to "pending". Recomputes days/total from the submitted
 * dates using the shared rental-days rules. Does not require admin auth — the
 * secret token authorizes the write.
 */
export async function submitReservation(token: string, input: unknown): Promise<ActionResult> {
  const reservation = await prisma.reservation.findUnique({ where: { token } });
  if (!reservation) return { ok: false, message: "Reserva no encontrada." };

  const parsed = customerReservationSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Revisa los campos.", fieldErrors: fieldErrorsFrom(parsed.error) };
  }
  const d = parsed.data;

  const billedDays = rentalDays({
    pickupDate: d.pickupDate,
    dropoffDate: d.dropoffDate,
    pickupTime: d.pickupTime,
    dropoffTime: d.dropoffTime,
  });
  const estimatedTotal = billedDays * reservation.dailyPrice;

  try {
    await prisma.reservation.update({
      where: { token },
      data: {
        customerName: d.customerName,
        email: d.email,
        phone: d.phone,
        country: d.country,
        idOrPassport: d.idOrPassport,
        driverLicense: d.driverLicense,
        pickupDate: parseDate(d.pickupDate),
        pickupTime: d.pickupTime,
        dropoffDate: parseDate(d.dropoffDate),
        dropoffTime: d.dropoffTime,
        pickupLocation: d.pickupLocation || null,
        dropoffLocation: d.dropoffLocation || null,
        paymentMethod: d.paymentMethod ?? null,
        paymentProofUrl: d.paymentProofUrl || null,
        billedDays,
        estimatedTotal,
        // Customer-submitted reservations move to "pending" for review.
        status: "pending",
      },
    });
  } catch (error) {
    console.error("submitReservation failed:", error);
    return { ok: false, message: "No se pudo enviar la reserva." };
  }

  revalidateReservations(token);
  return { ok: true, message: "Reserva enviada. Nos pondremos en contacto contigo." };
}

/* ----------------------------- Update status ------------------------------ */

export async function updateReservationStatus(
  id: string,
  status: string
): Promise<ActionResult> {
  try {
    await requirePermission("reservations.edit");
  } catch {
    return { ok: false, message: "No tienes permiso para gestionar reservas." };
  }

  if (!RESERVATION_STATUSES.includes(status as ReservationStatus)) {
    return { ok: false, message: "Estado inválido." };
  }

  try {
    await prisma.reservation.update({
      where: { id },
      data: { status: status as ReservationStatus },
    });
  } catch (error) {
    console.error("updateReservationStatus failed:", error);
    return { ok: false, message: "No se pudo actualizar el estado." };
  }

  revalidateReservations();
  return { ok: true, message: "Estado actualizado." };
}

/* ----------------------------- Delete ------------------------------------- */

export async function deleteReservation(id: string): Promise<ActionResult> {
  try {
    await requirePermission("reservations.edit");
  } catch {
    return { ok: false, message: "No tienes permiso para eliminar reservas." };
  }
  try {
    await prisma.reservation.delete({ where: { id } });
  } catch (error) {
    console.error("deleteReservation failed:", error);
    return { ok: false, message: "No se pudo eliminar la reserva." };
  }
  revalidateReservations();
  return { ok: true, message: "Reserva eliminada." };
}

/* --------------------------- Reservation settings ------------------------- */

/**
 * Saves the reservation settings singleton (Configuración de reservas).
 * Emulates upsert with findFirst + update/create (same pattern as branding).
 */
export async function updateReservationSettings(input: unknown): Promise<ActionResult> {
  try {
    await requirePermission("reservations.settings");
  } catch {
    return { ok: false, message: "No tienes permiso para configurar reservas." };
  }

  const parsed = reservationSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Revisa los campos.", fieldErrors: fieldErrorsFrom(parsed.error) };
  }
  const d = parsed.data;
  const orNull = (v: string | undefined) => (v && v.length > 0 ? v : null);

  const data = {
    digitalEnabled: d.digitalEnabled,
    defaultDeposit: d.defaultDeposit,
    paymentInstructions: orNull(d.paymentInstructions),
    zelleEnabled: d.zelleEnabled,
    zelleName: orNull(d.zelleName),
    zelleEmail: orNull(d.zelleEmail),
    zellePhone: orNull(d.zellePhone),
    paypalEnabled: d.paypalEnabled,
    paypalEmail: orNull(d.paypalEmail),
    paypalLink: orNull(d.paypalLink),
    cashappEnabled: d.cashappEnabled,
    cashappTag: orNull(d.cashappTag),
  };

  try {
    const existing = await prisma.reservationSettings.findFirst({ orderBy: { createdAt: "asc" } });
    if (existing) {
      await prisma.reservationSettings.update({ where: { id: existing.id }, data });
    } else {
      await prisma.reservationSettings.create({ data });
    }
  } catch (error) {
    console.error("updateReservationSettings failed:", error);
    return { ok: false, message: "No se pudo guardar la configuración." };
  }

  revalidatePath("/admin/reservations/settings");
  return { ok: true, message: "Configuración de reservas guardada." };
}

/* ----------------------- Upload payment proof image ----------------------- */

/** Uploads a payment proof image to Storage; returns its public URL. */
export async function uploadPaymentProof(
  formData: FormData
): Promise<{ ok: true; url: string } | { ok: false; message: string }> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Selecciona una imagen." };
  }
  const { uploadImage, STORAGE_FOLDERS } = await import("@/lib/storage/upload");
  const res = await uploadImage(STORAGE_FOLDERS.clients, file);
  if (!res.ok || !res.url) {
    return { ok: false, message: res.error ?? "No se pudo subir el comprobante." };
  }
  return { ok: true, url: res.url };
}
