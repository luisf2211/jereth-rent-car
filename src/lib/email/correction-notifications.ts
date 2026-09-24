import "server-only";
import prisma from "@/lib/prisma";
import { getResendClient, isResendConfigured, RESEND_FROM_EMAIL, emailBaseUrl } from "./resend";

/**
 * INTERNAL JERETH notification sent when a customer RESUBMITS a reservation
 * after it was marked "Requiere corrección" (needs_fix).
 *
 * This is intentionally separate from the "new reservation request" email
 * (reservation-notifications.ts): here we make it explicit that this is an
 * EXISTING reservation the customer corrected, not a brand-new one.
 *
 * Behaviour mirrors the new-reservation notification:
 *  - Reuses the same Resend config and the same internal recipient (env var
 *    RESERVATION_NOTIFICATION_EMAIL with the known JERETH inbox as fallback).
 *  - Fired only AFTER the reservation was saved back to "pending".
 *  - Never throws: any failure is logged (console + ReservationEmailLog) and
 *    swallowed, so the customer's correction is never affected.
 *  - Idempotent per correction cycle: guarded by a ReservationEmailLog row of
 *    type "correction_resubmitted". A new needs_fix cycle clears the prior log
 *    (see updateReservationStatus), so each real resubmit sends exactly once
 *    while double-clicks/retries within the same submit don't duplicate.
 */

export const CORRECTION_EMAIL_TYPE = "correction_resubmitted";

/** Same internal fallback recipient as the new-reservation notification. */
const INTERNAL_NOTIFICATION_FALLBACK = "jerethrentcarsrl@gmail.com";

function money(n: number): string {
  return `US$${n.toLocaleString("en-US")}`;
}

function fmtDate(d: Date | null): string {
  if (!d) return "—";
  return d.toLocaleDateString("es-DO", { day: "2-digit", month: "long", year: "numeric" });
}

/** Reservation shape needed to build the correction notification. */
export interface CorrectionNotifiable {
  id: string;
  code: string;
  customerName: string | null;
  phone: string | null;
  email: string | null;
  vehicleTitle: string;
  pickupDate: Date | null;
  pickupTime: string | null;
  dropoffDate: Date | null;
  dropoffTime: string | null;
  estimatedTotal: number;
  depositPaid: number;
}

function buildHtml(r: CorrectionNotifiable, viewUrl: string): string {
  const MAGENTA = "#EC0F8D";
  const BLACK = "#0B0B0C";
  const pickup = [fmtDate(r.pickupDate), r.pickupTime].filter(Boolean).join(" · ");
  const dropoff = [fmtDate(r.dropoffDate), r.dropoffTime].filter(Boolean).join(" · ");
  const deposit = r.depositPaid > 0 ? money(r.depositPaid) : "Sin depósito";

  const rowsHtml = [
    ["Número de reserva", r.code],
    ["Cliente", r.customerName || "—"],
    ["Teléfono / WhatsApp", r.phone || "—"],
    ["Vehículo", r.vehicleTitle],
    ["Recogida", pickup || "—"],
    ["Devolución", dropoff || "—"],
    ["Total", money(r.estimatedTotal)],
    ["Depósito", deposit],
    ["Estado", "Pendiente de revisión"],
  ]
    .map(
      ([k, v]) =>
        `<tr>
           <td style="padding:7px 0;color:#6E6E73;font-size:13px;border-bottom:1px solid #F0F0F2;">${k}</td>
           <td style="padding:7px 0;color:#191919;font-size:13px;font-weight:600;text-align:right;border-bottom:1px solid #F0F0F2;">${v}</td>
         </tr>`
    )
    .join("");

  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:auto;border:1px solid #eee;border-radius:12px;overflow:hidden">
    <div style="background:${BLACK};padding:18px 22px">
      <div style="color:#fff;font-size:18px;font-weight:800;letter-spacing:1px">JERETH RENT CAR</div>
      <div style="color:${MAGENTA};font-size:12px;margin-top:3px">✏️ Reserva corregida por el cliente</div>
    </div>
    <div style="padding:22px">
      <p style="margin:0 0 14px;color:#191919;font-size:14px">
        El cliente respondió a la solicitud de corrección y reenvió esta reserva
        <strong>existente</strong> (no es una reserva nueva). Vuelve a estar
        <strong>Pendiente de revisión</strong>. Revísala en el administrador.
      </p>
      <table style="width:100%;border-collapse:collapse">${rowsHtml}</table>
      <div style="text-align:center;margin-top:22px">
        <a href="${viewUrl}"
           style="display:inline-block;background:${MAGENTA};color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 26px;border-radius:8px">
          Revisar reserva
        </a>
      </div>
    </div>
    <div style="background:${BLACK};padding:12px 22px;color:#C4C4C8;font-size:11px;text-align:center">
      Notificación automática · JERETH RENT CAR
    </div>
  </div>`;
}

/**
 * Sends the internal notification for a corrected + resubmitted reservation.
 * Idempotent (per correction cycle) and non-throwing. Returns a small result
 * for logging/tests; callers ignore it.
 */
export async function sendCorrectionResubmittedNotification(
  r: CorrectionNotifiable
): Promise<{ sent: boolean; skipped?: boolean; reason?: string }> {
  // Idempotency: if we already logged a correction email for this reservation
  // in the CURRENT cycle, do nothing (prevents duplicates on double-click).
  // The log is cleared when the admin sets needs_fix again (next cycle).
  try {
    const already = await prisma.reservationEmailLog.findFirst({
      where: { reservationId: r.id, type: CORRECTION_EMAIL_TYPE, status: "sent" },
    });
    if (already) return { sent: false, skipped: true, reason: "already_sent" };
  } catch (e) {
    console.error("correction notification idempotency check failed:", e);
  }

  const to = process.env.RESERVATION_NOTIFICATION_EMAIL?.trim() || INTERNAL_NOTIFICATION_FALLBACK;
  if (!to) {
    console.error("No hay destinatario para la notificación de corrección; no se envía.");
    return { sent: false, reason: "no_recipient" };
  }
  if (!isResendConfigured()) {
    console.error("RESEND_API_KEY no está configurado; no se envía la notificación de corrección.");
    return { sent: false, reason: "resend_not_configured" };
  }

  const subject = `Reserva ${r.code} — Cliente realizó las correcciones solicitadas`;
  const viewUrl = `${emailBaseUrl()}/admin/reservations/${r.id}`;

  try {
    const resend = getResendClient();
    const { data, error } = await resend.emails.send({
      from: RESEND_FROM_EMAIL,
      to,
      subject,
      html: buildHtml(r, viewUrl),
    });
    if (error) {
      await logEmail(r.id, to, subject, "error", null, String(error?.message ?? error));
      console.error("sendCorrectionResubmittedNotification error:", error);
      return { sent: false, reason: "send_error" };
    }
    await logEmail(r.id, to, subject, "sent", data?.id ?? null, null);
    return { sent: true };
  } catch (e) {
    await logEmail(r.id, to, subject, "error", null, String((e as Error)?.message ?? e));
    console.error("sendCorrectionResubmittedNotification threw:", e);
    return { sent: false, reason: "exception" };
  }
}

async function logEmail(
  reservationId: string,
  toEmail: string,
  subject: string,
  status: "sent" | "error",
  providerId: string | null,
  error: string | null
): Promise<void> {
  try {
    await prisma.reservationEmailLog.create({
      data: {
        reservationId,
        type: CORRECTION_EMAIL_TYPE,
        toEmail,
        subject,
        status,
        providerId,
        error,
      },
    });
  } catch (e) {
    console.error("failed to write ReservationEmailLog (correction):", e);
  }
}
