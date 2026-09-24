"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requirePermission } from "@/lib/auth/current-user";
import {
  createReservationLinkSchema,
  customerReservationSchema,
  registerPaymentSchema,
  reservationSettingsSchema,
  updateStatusSchema,
  webReservationStartSchema,
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

/* ---------------- Start a reservation from the PUBLIC page ---------------- */

/**
 * PUBLIC action. Creates a reservation row from the public vehicle page so the
 * customer can continue in the existing digital form WITHOUT re-entering what
 * they already selected. No admin auth: this is the public entry point, gated
 * by the reservation settings switch (digitalEnabled). It never trusts a price
 * from the client — the real vehicle price is used and days/fees/total are
 * recomputed with the shared rules (same source of truth as submitReservation).
 * The reservation starts in "link_created" (does NOT block the vehicle) with
 * source "web" ("Página web") and returns a token to redirect the customer to
 * /reservar/<token>.
 */
export async function startWebReservation(
  input: unknown
): Promise<
  | { ok: true; token: string; code: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string> }
> {
  // The switch in Configuración de reservas is the source of truth. When the
  // digital flow is OFF, this action refuses (the public site stays WhatsApp).
  const settings = await prisma.reservationSettings.findFirst({ orderBy: { createdAt: "asc" } });
  if (!settings?.digitalEnabled) {
    return { ok: false, message: "La reserva digital no está disponible en este momento." };
  }

  const parsed = webReservationStartSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Revisa los datos de la reserva.", fieldErrors: fieldErrorsFrom(parsed.error) };
  }
  const d = parsed.data;

  // Use the REAL vehicle (and its real daily price) — never a client value.
  const vehicle = await prisma.vehicle.findUnique({ where: { id: d.vehicleId } });
  if (!vehicle) {
    return { ok: false, message: "El vehículo seleccionado no existe.", fieldErrors: { vehicleId: "Vehículo inválido" } };
  }
  const dailyPrice = vehicle.dailyPrice;

  // Recompute billed days with the shared rental-days rules (5pm rule + 3-day
  // minimum are enforced later in the form/submit; here we just carry the
  // estimate so the customer sees the same numbers they saw on the page).
  const billedDays =
    d.pickupDate && d.dropoffDate
      ? rentalDays({
          pickupDate: d.pickupDate,
          dropoffDate: d.dropoffDate,
          pickupTime: d.pickupTime || undefined,
          dropoffTime: d.dropoffTime || undefined,
        })
      : 0;
  const subtotalRent = billedDays * dailyPrice;

  // Resolve delivery locations (name + fee) from the existing table by ID,
  // gating the fee on hasFee — identical logic to submitReservation.
  const ids = [d.pickupLocationId, d.dropoffLocationId].filter(Boolean) as string[];
  const locations = ids.length
    ? await prisma.deliveryLocation.findMany({ where: { id: { in: ids } } })
    : [];
  const locOf = (id: string) => locations.find((l) => l.id === id) ?? null;
  const pickupLoc = d.pickupLocationId ? locOf(d.pickupLocationId) : null;
  const dropoffLoc = d.dropoffLocationId ? locOf(d.dropoffLocationId) : null;
  const pickupFee = pickupLoc?.hasFee ? pickupLoc.deliveryFee : 0;
  const dropoffFee = dropoffLoc?.hasFee ? dropoffLoc.deliveryFee : 0;
  const estimatedTotal = subtotalRent + pickupFee + dropoffFee;

  const token = generateToken();
  const code = generateCode();

  try {
    await prisma.reservation.create({
      data: {
        code,
        token,
        vehicleId: d.vehicleId,
        source: "web",
        status: "link_created",
        pickupDate: parseDate(d.pickupDate),
        pickupTime: d.pickupTime || null,
        dropoffDate: parseDate(d.dropoffDate),
        dropoffTime: d.dropoffTime || null,
        // Store resolved location NAMES (getReservationByToken maps them back
        // to IDs to pre-select the form selectors).
        pickupLocation: pickupLoc?.name ?? null,
        dropoffLocation: dropoffLoc?.name ?? null,
        dailyPrice,
        billedDays,
        subtotalRent,
        pickupFee,
        dropoffFee,
        estimatedTotal,
      },
    });
  } catch (error) {
    console.error("startWebReservation failed:", error);
    return { ok: false, message: "No se pudo iniciar la reserva." };
  }

  revalidateReservations(token);
  return { ok: true, token, code };
}

/* --------------------- Submit the digital reservation --------------------- */

/**
 * Saves the CUSTOMER's submission of the digital form (from the link). Moves
 * the reservation to "pending". Recomputes days/total from the submitted
 * dates using the shared rental-days rules, resolves the chosen delivery
 * locations (name + fee) from the existing DeliveryLocation table, and
 * computes the deposit/balance breakdown. Does not require admin auth — the
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

  // --- Rent subtotal (shared rental-days rules) ---
  const billedDays = rentalDays({
    pickupDate: d.pickupDate,
    dropoffDate: d.dropoffDate,
    pickupTime: d.pickupTime,
    dropoffTime: d.dropoffTime,
  });
  const subtotalRent = billedDays * reservation.dailyPrice;

  // --- Resolve delivery locations (name + fee) from the existing table ---
  const ids = [d.pickupLocationId, d.dropoffLocationId].filter(Boolean) as string[];
  const locations = ids.length
    ? await prisma.deliveryLocation.findMany({ where: { id: { in: ids } } })
    : [];
  const locOf = (id: string) => locations.find((l) => l.id === id) ?? null;
  const pickupLoc = d.pickupLocationId ? locOf(d.pickupLocationId) : null;
  const dropoffLoc = d.dropoffLocationId ? locOf(d.dropoffLocationId) : null;
  // A location only adds a fee when hasFee is true (reuse existing logic).
  const pickupFee = pickupLoc?.hasFee ? pickupLoc.deliveryFee : 0;
  const dropoffFee = dropoffLoc?.hasFee ? dropoffLoc.deliveryFee : 0;

  // --- Grand total (deposit is PART of this, never added on top) ---
  const estimatedTotal = subtotalRent + pickupFee + dropoffFee;

  // --- Deposit / balance ---
  // Validate the chosen deposit against the configured options (0 = allowed).
  const settingsRow = await prisma.reservationSettings.findFirst({ orderBy: { createdAt: "asc" } });
  const allowedOptions = settingsRow && settingsRow.depositOptions.length > 0
    ? settingsRow.depositOptions
    : [100, 150];
  const depositPaid = d.depositChoice > 0 ? d.depositChoice : 0;
  if (depositPaid > 0 && !allowedOptions.includes(depositPaid)) {
    return { ok: false, message: "El monto de depósito seleccionado no es válido." };
  }
  // When a deposit is chosen, a payment method + proof are expected.
  if (depositPaid > 0) {
    if (!d.paymentMethod) {
      return { ok: false, message: "Selecciona un método de pago.", fieldErrors: { paymentMethod: "Requerido con depósito" } };
    }
    if (!d.paymentProofUrl) {
      return { ok: false, message: "Sube el comprobante de pago.", fieldErrors: { paymentProofUrl: "Requerido con depósito" } };
    }
  }
  const balanceDue = Math.max(estimatedTotal - depositPaid, 0);

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
        // Store the resolved location NAMES (readable in admin + tracking).
        pickupLocation: pickupLoc?.name ?? null,
        dropoffLocation: dropoffLoc?.name ?? null,
        pickupFee,
        dropoffFee,
        subtotalRent,
        estimatedTotal,
        // Only keep payment info when a deposit was actually chosen.
        paymentMethod: depositPaid > 0 ? d.paymentMethod ?? null : null,
        paymentProofUrl: depositPaid > 0 ? d.paymentProofUrl || null : null,
        depositPaid,
        balanceDue,
        billedDays,
        // Optional special request (empty = none).
        specialRequest: d.specialRequest || null,
        // --- Flight info (only persisted when the customer opted in) ---
        hasArrivalFlight: d.hasArrivalFlight,
        arrivalAirline: d.hasArrivalFlight ? d.arrivalAirline || null : null,
        arrivalFlightNumber: d.hasArrivalFlight ? d.arrivalFlightNumber || null : null,
        arrivalAirport: d.hasArrivalFlight ? d.arrivalAirport || null : null,
        arrivalDate: d.hasArrivalFlight ? parseDate(d.arrivalDate) : null,
        arrivalTime: d.hasArrivalFlight ? d.arrivalTime || null : null,
        arrivalItineraryUrl: d.hasArrivalFlight ? d.arrivalItineraryUrl || null : null,
        hasReturnFlight: d.hasReturnFlight,
        returnAirline: d.hasReturnFlight ? d.returnAirline || null : null,
        returnFlightNumber: d.hasReturnFlight ? d.returnFlightNumber || null : null,
        returnAirport: d.hasReturnFlight ? d.returnAirport || null : null,
        returnDate: d.hasReturnFlight ? parseDate(d.returnDate) : null,
        returnTime: d.hasReturnFlight ? d.returnTime || null : null,
        returnItineraryUrl: d.hasReturnFlight ? d.returnItineraryUrl || null : null,
        // All submissions start (or return to) pending, regardless of deposit.
        // This also covers the "needs_fix" correction resubmit flow.
        status: "pending",
        // Clear any prior correction/rejection message so the customer no
        // longer sees a stale "please fix" note after resubmitting.
        statusMessage: null,
        statusMessageVisible: false,
      },
    });
  } catch (error) {
    console.error("submitReservation failed:", error);
    return { ok: false, message: "No se pudo enviar la reserva." };
  }

  // The reservation is saved correctly. Notify the admin by email (Resend).
  // Non-blocking + idempotent: any failure is logged and swallowed so the
  // customer's request is never affected, and no duplicate email is sent on
  // resubmit / re-open.
  try {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: reservation.vehicleId },
      select: { brand: true, model: true, year: true },
    });
    const vehicleTitle = vehicle ? `${vehicle.brand} ${vehicle.model} ${vehicle.year}` : "—";

    // Internal JERETH notification and the customer email are sent
    // INDEPENDENTLY: each is wrapped so a failure in one can never affect the
    // other, and neither can affect the saved reservation.
    //
    // Which internal email? If this submission is the customer RESPONDING to a
    // "Requiere corrección" (the reservation's status BEFORE this update was
    // needs_fix), send the "corrected reservation" notice instead of the
    // "new reservation" one — so JERETH knows it's an existing corrected
    // reservation, not a new request. The customer email is unchanged.
    const wasNeedsFix = reservation.status === "needs_fix";
    try {
      if (wasNeedsFix) {
        const { sendCorrectionResubmittedNotification } = await import(
          "@/lib/email/correction-notifications"
        );
        await sendCorrectionResubmittedNotification({
          id: reservation.id,
          code: reservation.code,
          customerName: d.customerName,
          phone: d.phone,
          email: d.email,
          vehicleTitle,
          pickupDate: parseDate(d.pickupDate),
          pickupTime: d.pickupTime,
          dropoffDate: parseDate(d.dropoffDate),
          dropoffTime: d.dropoffTime,
          estimatedTotal,
          depositPaid,
        });
      } else {
        const { sendNewReservationNotification } = await import("@/lib/email/reservation-notifications");
        await sendNewReservationNotification({
          id: reservation.id,
          code: reservation.code,
          customerName: d.customerName,
          phone: d.phone,
          email: d.email,
          vehicleTitle,
          pickupDate: parseDate(d.pickupDate),
          pickupTime: d.pickupTime,
          dropoffDate: parseDate(d.dropoffDate),
          dropoffTime: d.dropoffTime,
          estimatedTotal,
          depositPaid,
          source: reservation.source,
        });
      }
    } catch (error) {
      console.error("internal reservation notification failed (ignored):", error);
    }

    // Customer confirmation-of-receipt email ("Solicitud de reserva recibida").
    // Idempotent + non-throwing, so a resubmit or a mail hiccup never affects
    // the saved reservation.
    try {
      const { sendCustomerRequestReceived } = await import("@/lib/email/customer-notifications");
      await sendCustomerRequestReceived({
        id: reservation.id,
        code: reservation.code,
        token: reservation.token,
        customerName: d.customerName,
        email: d.email,
        vehicleTitle,
        pickupDate: parseDate(d.pickupDate),
        pickupTime: d.pickupTime,
        dropoffDate: parseDate(d.dropoffDate),
        dropoffTime: d.dropoffTime,
        estimatedTotal,
        depositPaid,
        balanceDue,
      });
    } catch (error) {
      console.error("customer request-received email failed (ignored):", error);
    }
  } catch (error) {
    // Extra safety net — must never break the reservation flow.
    console.error("reservation notification block failed (ignored):", error);
  }

  revalidateReservations(token);
  return { ok: true, message: "Solicitud de reserva recibida." };
}

/* -------- Create + submit a PUBLIC reservation in ONE step (web flow) ------ */

/**
 * PUBLIC action for the web flow. Unlike the old startWebReservation (which
 * persisted a "link_created" row as soon as the form opened, leaving "ghost"
 * reservations when the customer abandoned), this action ONLY persists when
 * the customer completes and submits the form.
 *
 * It creates a minimal reservation row and immediately runs the SAME
 * submitReservation logic (validations, server-side recompute, emails, status
 * → pending). If the submission is invalid, the just-created row is deleted so
 * NO ghost reservation remains. On success it returns the token + code so the
 * customer is sent to the permanent tracking portal (/reservar/<token>).
 *
 * Manual admin links are unaffected: they keep using createReservationLink +
 * submitReservation(token, ...).
 */
export async function createAndSubmitWebReservation(
  input: unknown
): Promise<ActionResult & { token?: string; code?: string }> {
  // Gate: digital flow must be enabled (same source of truth as elsewhere).
  const settings = await prisma.reservationSettings.findFirst({ orderBy: { createdAt: "asc" } });
  if (!settings?.digitalEnabled) {
    return { ok: false, message: "La reserva digital no está disponible en este momento." };
  }

  // Validate the customer payload up front (same schema submitReservation uses)
  // so we never create a row for an invalid submission.
  const parsed = customerReservationSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Revisa los campos.", fieldErrors: fieldErrorsFrom(parsed.error) };
  }
  const d = parsed.data;

  // The vehicleId travels on the payload (added by the public "create" form).
  const vehicleId = typeof (input as { vehicleId?: unknown })?.vehicleId === "string"
    ? (input as { vehicleId: string }).vehicleId
    : "";
  const vehicle = await prisma.vehicle.findUnique({ where: { id: vehicleId } });
  if (!vehicle) {
    return { ok: false, message: "El vehículo seleccionado no existe." };
  }

  // Create a minimal row (real vehicle price; days/fees/total are recomputed by
  // submitReservation). source "web", status "link_created" (does not block).
  const token = generateToken();
  const code = generateCode();
  try {
    await prisma.reservation.create({
      data: {
        code,
        token,
        vehicleId: vehicle.id,
        source: "web",
        status: "link_created",
        dailyPrice: vehicle.dailyPrice,
      },
    });
  } catch (error) {
    console.error("createAndSubmitWebReservation create failed:", error);
    return { ok: false, message: "No se pudo iniciar la reserva." };
  }

  // Run the EXACT existing submit logic against the freshly created row.
  const result = await submitReservation(token, input);

  // If the submission was rejected, roll back the row so no ghost remains.
  if (!result.ok) {
    try {
      await prisma.reservation.delete({ where: { token } });
    } catch (error) {
      console.error("rollback of unsubmitted web reservation failed:", error);
    }
    return result;
  }

  return { ...result, token, code };
}

/* ----------------------------- Update status ------------------------------ */

export async function updateReservationStatus(
  id: string,
  input: unknown
): Promise<ActionResult> {
  try {
    await requirePermission("reservations.edit");
  } catch {
    return { ok: false, message: "No tienes permiso para gestionar reservas." };
  }

  // Accept either a bare status string (backwards compatible) or an object
  // { status, statusMessage, statusMessageVisible } from the detail view.
  const raw = typeof input === "string" ? { status: input } : input;
  const parsed = updateStatusSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, message: "Estado inválido.", fieldErrors: fieldErrorsFrom(parsed.error) };
  }
  const { status, statusMessage, statusMessageVisible } = parsed.data;

  // The message + visibility apply to "rejected" and "needs_fix". For any
  // other status we clear them so no stale message lingers.
  const keepsMessage = status === "rejected" || status === "needs_fix";

  try {
    await prisma.reservation.update({
      where: { id },
      data: {
        status,
        statusMessage: keepsMessage ? statusMessage || null : null,
        statusMessageVisible: keepsMessage ? statusMessageVisible : false,
        // Keep legacy field in sync for rejected (used elsewhere historically).
        rejectionReason: status === "rejected" ? statusMessage || null : null,
      },
    });
  } catch (error) {
    console.error("updateReservationStatus failed:", error);
    return { ok: false, message: "No se pudo actualizar el estado." };
  }

  // Starting a NEW correction cycle: clear the prior "correction resubmitted"
  // email log so the next real resubmit sends the internal notice exactly once
  // again. Best-effort; a failure here must never block the status change.
  if (status === "needs_fix") {
    try {
      const { CORRECTION_EMAIL_TYPE } = await import("@/lib/email/correction-notifications");
      await prisma.reservationEmailLog.deleteMany({
        where: { reservationId: id, type: CORRECTION_EMAIL_TYPE },
      });
    } catch (error) {
      console.error("failed to reset correction email log (ignored):", error);
    }
  }

  // --- Side effects (PDF + customer emails) ---
  // The status is already persisted (source of truth). Everything below is
  // best-effort: it NEVER throws back to the caller and NEVER reverts the
  // status, so a failed PDF or email can't undo a valid confirmation. Errors
  // are logged and recorded in ReservationEmailLog. All emails are idempotent,
  // so re-running the same action does not send duplicates.
  try {
    await runStatusSideEffects(id, status, {
      statusMessage: statusMessage || "",
      statusMessageVisible,
    });
  } catch (error) {
    console.error("reservation status side-effects failed (ignored):", error);
  }

  revalidateReservations();
  const id2 = id;
  revalidatePath(`/admin/reservations/${id2}`);
  if (status === "confirmed") {
    // Also refresh the customer portal so the PDF/confirmation shows up.
    try {
      const row = await prisma.reservation.findUnique({ where: { id }, select: { token: true } });
      if (row?.token) revalidatePath(`/reservar/${row.token}`);
    } catch {
      /* ignore */
    }
  }
  return { ok: true, message: "Estado actualizado." };
}

/* --------------------- Register a manual admin payment -------------------- */

/**
 * Records a MANUAL payment against a reservation (append-only history).
 *
 * - Admin only (reservations.edit).
 * - Creates a new ReservationPayment row; never overwrites previous payments
 *   and never touches Reservation.depositPaid (the initial deposit stays as
 *   its own amount so the same money is never counted twice — "total paid" is
 *   computed as depositPaid + SUM(payments) wherever it's shown).
 * - NEVER changes the reservation status (purely administrative).
 */
export async function registerReservationPayment(
  reservationId: string,
  input: unknown
): Promise<ActionResult> {
  try {
    await requirePermission("reservations.edit");
  } catch {
    return { ok: false, message: "No tienes permiso para gestionar reservas." };
  }

  const parsed = registerPaymentSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, message: "Revisa los datos del pago.", fieldErrors: fieldErrorsFrom(parsed.error) };
  }
  const d = parsed.data;

  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    select: { id: true },
  });
  if (!reservation) return { ok: false, message: "Reserva no encontrada." };

  // Parse the YYYY-MM-DD date; fall back to now() if it can't be parsed.
  const paidAt = parseDate(d.paidAt) ?? new Date();

  try {
    await prisma.reservationPayment.create({
      data: {
        reservationId,
        amount: d.amount,
        method: d.method,
        paidAt,
        proofUrl: d.proofUrl && d.proofUrl.length > 0 ? d.proofUrl : null,
        note: d.note && d.note.length > 0 ? d.note : null,
      },
    });
  } catch (error) {
    console.error("registerReservationPayment failed:", error);
    return { ok: false, message: "No se pudo registrar el pago." };
  }

  // Refresh the expediente so the new payment + updated balance show up.
  revalidateReservations();
  revalidatePath(`/admin/reservations/${reservationId}`);
  return { ok: true, message: "Pago registrado." };
}

/**
 * Builds the customer-email payload from a reservation row + vehicle title.
 */
function toCustomerNotifiable(r: {
  id: string;
  code: string;
  token: string;
  customerName: string | null;
  email: string | null;
  pickupDate: Date | null;
  pickupTime: string | null;
  dropoffDate: Date | null;
  dropoffTime: string | null;
  estimatedTotal: number;
  depositPaid: number;
  balanceDue: number;
}, vehicleTitle: string) {
  return {
    id: r.id,
    code: r.code,
    token: r.token,
    customerName: r.customerName,
    email: r.email,
    vehicleTitle,
    pickupDate: r.pickupDate,
    pickupTime: r.pickupTime,
    dropoffDate: r.dropoffDate,
    dropoffTime: r.dropoffTime,
    estimatedTotal: r.estimatedTotal,
    depositPaid: r.depositPaid,
    balanceDue: r.balanceDue,
  };
}

/**
 * Runs the per-status customer email + (for "confirmed") the official PDF
 * generation. Best-effort and idempotent. Never throws to the caller.
 */
async function runStatusSideEffects(
  id: string,
  status: import("@/lib/validations/reservation").ReservationStatus,
  msg: { statusMessage: string; statusMessageVisible: boolean }
): Promise<void> {
  // These statuses have no customer email/PDF side effect.
  if (status === "link_created" || status === "pending") return;

  const r = await prisma.reservation.findUnique({
    where: { id },
    include: { vehicle: true },
  });
  if (!r) return;
  const vehicleTitle = `${r.vehicle.brand} ${r.vehicle.model} ${r.vehicle.year}`;
  const notifiable = toCustomerNotifiable(r, vehicleTitle);

  if (status === "needs_fix") {
    // Only send the message to the customer when the admin marked it visible.
    const visibleMessage = msg.statusMessageVisible ? msg.statusMessage : "";
    const { sendReservationNeedsFix } = await import("@/lib/email/customer-notifications");
    await sendReservationNeedsFix(notifiable, visibleMessage);
    return;
  }

  if (status === "rejected") {
    const visibleReason = msg.statusMessageVisible ? msg.statusMessage || null : null;
    const { sendReservationRejected } = await import("@/lib/email/customer-notifications");
    await sendReservationRejected(notifiable, visibleReason);
    return;
  }

  if (status === "cancelled") {
    const { sendReservationCancelled } = await import("@/lib/email/customer-notifications");
    await sendReservationCancelled(notifiable);
    return;
  }

  if (status === "confirmed") {
    await confirmReservationSideEffects(r, vehicleTitle, notifiable);
  }
}

/**
 * Confirmation side effects: generate the official PDF from the REAL data,
 * store it, persist confirmedAt/confirmationPdfUrl/confirmationSnapshot, and
 * email it to the customer with a download link. Each step degrades
 * gracefully: if the PDF can't be produced we still send the confirmation
 * email (without the attachment) so the customer is informed.
 */
async function confirmReservationSideEffects(
  r: {
    id: string;
    code: string;
    confirmedAt: Date | null;
    confirmationPdfUrl: string | null;
    // plus all snapshot fields via the full row
    [k: string]: unknown;
  },
  vehicleTitle: string,
  notifiable: ReturnType<typeof toCustomerNotifiable>
): Promise<void> {
  // The published template is the definitive design of record. Requiring it to
  // exist keeps the published template provably part of the confirmation path.
  const { getPublishedReservationTemplate } = await import("@/features/reservation-template/data");
  const published = await getPublishedReservationTemplate();
  if (!published) {
    console.error(`confirm ${r.code}: no published reservation template; skipping PDF.`);
  }

  const confirmedAt = (r.confirmedAt as Date | null) ?? new Date();

  let pdfBuffer: Buffer | null = null;
  let pdfUrl: string | null = (r.confirmationPdfUrl as string | null) ?? null;

  if (published) {
    try {
      const { getCompanySettings } = await import("@/lib/branding");
      const { buildConfirmationSnapshot } = await import("@/lib/reservations/pdf/build-snapshot");
      const { renderConfirmationPdfFromTemplate, renderConfirmationPdf } = await import("@/lib/reservations/pdf/generate");
      const { uploadBuffer, STORAGE_FOLDERS } = await import("@/lib/storage/upload");

      const company = await getCompanySettings();
      const vehicle = (r as unknown as { vehicle: Record<string, unknown> }).vehicle;
      const snapshot = buildConfirmationSnapshot(
        {
          ...(r as unknown as import("@/lib/reservations/pdf/build-snapshot").SnapshotReservation),
          // policyAccepted defaults to true if the row predates the field.
          policyAccepted: (r.policyAccepted as boolean) ?? true,
          policyAcceptedAt: (r.policyAcceptedAt as Date | null) ?? (r.createdAt as Date),
        },
        {
          brand: vehicle.brand as string,
          model: vehicle.model as string,
          year: vehicle.year as number,
          category: vehicle.category as string,
          transmission: vehicle.transmission as string,
          passengers: vehicle.passengers as number,
          imageUrl: vehicle.imageUrl as string,
          documentImageUrl: (vehicle.documentImageUrl as string | null) ?? null,
          features: (vehicle.features as string[]) ?? [],
        },
        company,
        confirmedAt
      );

      // Render the PDF from the PUBLISHED builder template (exact design +
      // real data). Fall back to the legacy hardcoded layout only if the
      // template render fails for some reason, so confirmation never breaks.
      try {
        pdfBuffer = await renderConfirmationPdfFromTemplate(published.document, snapshot);
      } catch (tplErr) {
        console.error(`confirm ${r.code}: template PDF render failed, using legacy layout:`, tplErr);
        pdfBuffer = await renderConfirmationPdf(snapshot);
      }

      const up = await uploadBuffer(new Uint8Array(pdfBuffer), {
        path: `${STORAGE_FOLDERS.confirmations}/${r.code}.pdf`,
        contentType: "application/pdf",
        upsert: true,
      });
      if (up.ok && up.url) pdfUrl = up.url;

      // Persist the confirmation artifacts so the portal + future re-sends use
      // the exact document generated now (immutable snapshot).
      await prisma.reservation.update({
        where: { id: r.id },
        data: {
          confirmedAt,
          confirmationPdfUrl: pdfUrl,
          confirmationSnapshot: snapshot as unknown as object,
        },
      });
    } catch (e) {
      console.error(`confirm ${r.code}: PDF generation/upload failed (email will still send):`, e);
    }
  }

  const { sendReservationConfirmed } = await import("@/lib/email/customer-notifications");
  await sendReservationConfirmed(
    notifiable,
    pdfBuffer ? { filename: `Reserva-${r.code}.pdf`, content: pdfBuffer } : null,
    pdfUrl
  );
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
    // De-duplicate and sort the configurable deposit amounts.
    depositOptions: Array.from(new Set(d.depositOptions)).sort((a, b) => a - b),
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

/* ----------------------- Upload flight itinerary -------------------------- */

/**
 * Uploads a flight itinerary (image or PDF) to Storage; returns its public URL.
 * Reuses the shared storage infrastructure (clients/ folder), same as the
 * payment proof, but also accepts PDF.
 */
export async function uploadFlightItinerary(
  formData: FormData
): Promise<{ ok: true; url: string } | { ok: false; message: string }> {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, message: "Selecciona un archivo." };
  }
  const { uploadDocument, STORAGE_FOLDERS } = await import("@/lib/storage/upload");
  const res = await uploadDocument(STORAGE_FOLDERS.clients, file);
  if (!res.ok || !res.url) {
    return { ok: false, message: res.error ?? "No se pudo subir el archivo." };
  }
  return { ok: true, url: res.url };
}
