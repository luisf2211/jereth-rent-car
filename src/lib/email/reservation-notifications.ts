import "server-only";
import prisma from "@/lib/prisma";
import { getResendClient, isResendConfigured, RESEND_FROM_EMAIL } from "./resend";
import { RESERVATION_SOURCE_LABELS, type ReservationSource } from "@/lib/validations/reservation";

/**
 * Admin notification when a customer submits a reservation request.
 *
 * - Sent for BOTH deposit and no-deposit reservations.
 * - Fired only AFTER the reservation was saved correctly (caller decides).
 * - Never throws: any failure is logged (console + ReservationEmailLog) and
 *   swallowed, so the customer's request is never affected.
 * - Idempotent: guarded by a ReservationEmailLog row of type
 *   "request_received" — if one already exists for this reservation, it does
 *   nothing (prevents duplicates on resubmit / re-open / double click).
 */

const EMAIL_TYPE = "request_received";

function money(n: number): string {
  return `US$${n.toLocaleString("en-US")}`;
}

function fmtDate(d: Date | null): string {
  if (!d) return "—";
  return d.toLocaleDateString("es-DO", { day: "2-digit", month: "long", year: "numeric" });
}

/** Base URL for the "Ver reserva" button (admin). Configurable via env. */
function adminBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.AUTH_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

/** Reservation shape needed to build the notification. */
export interface NotifiableReservation {
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
  source: string;
}

function buildHtml(r: NotifiableReservation, viewUrl: string): string {
  const MAGENTA = "#EC0F8D";
  const BLACK = "#0B0B0C";
  const pickup = [fmtDate(r.pickupDate), r.pickupTime].filter(Boolean).join(" · ");
  const dropoff = [fmtDate(r.dropoffDate), r.dropoffTime].filter(Boolean).join(" · ");
  const deposit = r.depositPaid > 0 ? money(r.depositPaid) : "Sin depósito";
  const sourceLabel = RESERVATION_SOURCE_LABELS[r.source as ReservationSource] ?? r.source;

  const rowsHtml = [
    ["Número de reserva", r.code],
    ["Cliente", r.customerName || "—"],
    ["Teléfono / WhatsApp", r.phone || "—"],
    ["Vehículo", r.vehicleTitle],
    ["Recogida", pickup || "—"],
    ["Devolución", dropoff || "—"],
    ["Total", money(r.estimatedTotal)],
    ["Depósito", deposit],
    ["Origen", sourceLabel],
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
      <div style="color:${MAGENTA};font-size:12px;margin-top:3px">🔔 Nueva solicitud de reserva</div>
    </div>
    <div style="padding:22px">
      <p style="margin:0 0 14px;color:#191919;font-size:14px">
        Un cliente completó y envió una solicitud de reserva. Revísala en el administrador.
      </p>
      <table style="width:100%;border-collapse:collapse">${rowsHtml}</table>
      <div style="text-align:center;margin-top:22px">
        <a href="${viewUrl}"
           style="display:inline-block;background:${MAGENTA};color:#fff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 26px;border-radius:8px">
          Ver reserva
        </a>
      </div>
    </div>
    <div style="background:${BLACK};padding:12px 22px;color:#C4C4C8;font-size:11px;text-align:center">
      Notificación automática · JERETH RENT CAR
    </div>
  </div>`;
}

/**
 * Sends the admin notification for a submitted reservation. Idempotent and
 * non-throwing. Returns a small result for logging/tests; callers ignore it.
 */
export async function sendNewReservationNotification(
  r: NotifiableReservation
): Promise<{ sent: boolean; skipped?: boolean; reason?: string }> {
  // Idempotency: if we already logged a request_received email for this
  // reservation, do nothing (avoids duplicates on resubmit / re-open).
  try {
    const already = await prisma.reservationEmailLog.findFirst({
      where: { reservationId: r.id, type: EMAIL_TYPE, status: "sent" },
    });
    if (already) return { sent: false, skipped: true, reason: "already_sent" };
  } catch (e) {
    // If the check fails we still try to send once; don't block on it.
    console.error("reservation notification idempotency check failed:", e);
  }

  const to = process.env.RESERVATION_NOTIFICATION_EMAIL?.trim();
  if (!to) {
    console.error("RESERVATION_NOTIFICATION_EMAIL no está configurado; no se envía la notificación.");
    return { sent: false, reason: "no_recipient" };
  }
  if (!isResendConfigured()) {
    console.error("RESEND_API_KEY no está configurado; no se envía la notificación.");
    return { sent: false, reason: "resend_not_configured" };
  }

  const subject = `🔔 Nueva solicitud de reserva – ${r.code}`;
  const viewUrl = `${adminBaseUrl()}/admin/reservations/${r.id}`;

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
      console.error("sendNewReservationNotification error:", error);
      return { sent: false, reason: "send_error" };
    }
    await logEmail(r.id, to, subject, "sent", data?.id ?? null, null);
    return { sent: true };
  } catch (e) {
    await logEmail(r.id, to, subject, "error", null, String((e as Error)?.message ?? e));
    console.error("sendNewReservationNotification threw:", e);
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
      data: { reservationId, type: EMAIL_TYPE, toEmail, subject, status, providerId, error },
    });
  } catch (e) {
    console.error("failed to write ReservationEmailLog:", e);
  }
}
