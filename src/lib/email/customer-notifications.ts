import "server-only";
import prisma from "@/lib/prisma";
import { getResendClient, isResendConfigured, RESEND_FROM_EMAIL } from "./resend";

/**
 * CUSTOMER-facing reservation emails (Resend).
 *
 * Covers the whole lifecycle the customer sees:
 *  - request_received_customer : "Solicitud de reserva recibida" (pending)
 *  - needs_fix                 : correction requested (visible message + link)
 *  - confirmed                 : official confirmation + PDF attached
 *  - rejected                  : not approved (reason only if marked visible)
 *  - cancelled                 : reservation cancelled
 *
 * Cross-cutting guarantees (match the admin notification module):
 *  - NEVER throw: every failure is logged (console + ReservationEmailLog) and
 *    swallowed, so a failed email never reverts the reservation's valid state.
 *  - Idempotent: one ReservationEmailLog row of the given `type` with
 *    status "sent" means we won't send that email again (prevents duplicates
 *    when an admin action runs more than once).
 *  - The RESEND_API_KEY lives only in the server env (this module is
 *    `server-only`); it is never logged and never sent to the client.
 */

/** ReservationEmailLog.type values used by the customer flow. */
export type CustomerEmailType =
  | "request_received_customer"
  | "needs_fix"
  | "confirmed"
  | "rejected"
  | "cancelled";

const MAGENTA = "#EC0F8D";
const BLACK = "#0B0B0C";

function money(n: number): string {
  return `US$${n.toLocaleString("en-US")}`;
}

function fmtDate(d: Date | null): string {
  if (!d) return "—";
  return d.toLocaleDateString("es-DO", { day: "2-digit", month: "long", year: "numeric" });
}

/** Public site base URL for the customer "Ver mi reserva" links. */
function siteBaseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.AUTH_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

/** Absolute link to the customer's reservation portal. */
export function reservationUrl(token: string): string {
  return `${siteBaseUrl()}/reservar/${token}`;
}
/** Absolute link that opens the editable correction form. */
export function reservationCorrectionUrl(token: string): string {
  return `${reservationUrl(token)}?corregir=1`;
}

/** Reservation fields every customer email needs. */
export interface CustomerNotifiable {
  id: string;
  code: string;
  token: string;
  customerName: string | null;
  email: string | null;
  vehicleTitle: string;
  pickupDate: Date | null;
  pickupTime: string | null;
  dropoffDate: Date | null;
  dropoffTime: string | null;
  estimatedTotal: number;
  depositPaid: number;
  balanceDue: number;
}

/** Optional PDF attachment for the confirmation email. */
export interface EmailAttachment {
  filename: string;
  content: Buffer;
}

interface SendResult {
  sent: boolean;
  skipped?: boolean;
  reason?: string;
}

/** Idempotency: has this exact email type already been sent for this res? */
async function alreadySent(reservationId: string, type: CustomerEmailType): Promise<boolean> {
  try {
    const row = await prisma.reservationEmailLog.findFirst({
      where: { reservationId, type, status: "sent" },
    });
    return Boolean(row);
  } catch (e) {
    // If the check fails, don't block the (single) send attempt.
    console.error(`idempotency check failed for ${type}:`, e);
    return false;
  }
}

async function logEmail(
  reservationId: string,
  type: CustomerEmailType,
  toEmail: string,
  subject: string,
  status: "sent" | "error",
  providerId: string | null,
  error: string | null
): Promise<void> {
  try {
    await prisma.reservationEmailLog.create({
      data: { reservationId, type, toEmail, subject, status, providerId, error },
    });
  } catch (e) {
    console.error("failed to write ReservationEmailLog:", e);
  }
}

/**
 * Core sender: guards config + recipient + idempotency, sends via Resend,
 * logs the outcome, and never throws.
 */
async function sendCustomerEmail(
  r: CustomerNotifiable,
  type: CustomerEmailType,
  subject: string,
  html: string,
  attachments?: EmailAttachment[]
): Promise<SendResult> {
  if (await alreadySent(r.id, type)) {
    return { sent: false, skipped: true, reason: "already_sent" };
  }

  const to = r.email?.trim();
  if (!to) {
    console.error(`reservation ${r.code}: no customer email; skipping ${type}.`);
    return { sent: false, reason: "no_recipient" };
  }
  if (!isResendConfigured()) {
    console.error(`RESEND_API_KEY not configured; skipping ${type} for ${r.code}.`);
    return { sent: false, reason: "resend_not_configured" };
  }

  try {
    const resend = getResendClient();
    const { data, error } = await resend.emails.send({
      from: RESEND_FROM_EMAIL,
      to,
      subject,
      html,
      ...(attachments && attachments.length
        ? { attachments: attachments.map((a) => ({ filename: a.filename, content: a.content })) }
        : {}),
    });
    if (error) {
      await logEmail(r.id, type, to, subject, "error", null, String(error?.message ?? error));
      console.error(`sendCustomerEmail(${type}) error:`, error);
      return { sent: false, reason: "send_error" };
    }
    await logEmail(r.id, type, to, subject, "sent", data?.id ?? null, null);
    return { sent: true };
  } catch (e) {
    await logEmail(r.id, type, to, subject, "error", null, String((e as Error)?.message ?? e));
    console.error(`sendCustomerEmail(${type}) threw:`, e);
    return { sent: false, reason: "exception" };
  }
}

/* --------------------------------- Shell --------------------------------- */

/** Shared branded email shell. `accent` colors the header sub-line. */
function shell(opts: {
  badge: string;
  title: string;
  intro: string;
  bodyHtml: string;
  ctas: { label: string; url: string; primary?: boolean }[];
  footerNote?: string;
}): string {
  const buttons = opts.ctas
    .map((c) => {
      const bg = c.primary === false ? "#FFFFFF" : MAGENTA;
      const color = c.primary === false ? MAGENTA : "#FFFFFF";
      const border = c.primary === false ? `2px solid ${MAGENTA}` : "none";
      return `<a href="${c.url}" style="display:inline-block;margin:4px 6px;background:${bg};color:${color};border:${border};text-decoration:none;font-weight:700;font-size:14px;padding:11px 24px;border-radius:8px">${c.label}</a>`;
    })
    .join("");

  return `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:560px;margin:auto;border:1px solid #eee;border-radius:12px;overflow:hidden">
    <div style="background:${BLACK};padding:18px 22px">
      <div style="color:#fff;font-size:18px;font-weight:800;letter-spacing:1px">JERETH RENT CAR</div>
      <div style="color:${MAGENTA};font-size:12px;margin-top:3px">${opts.badge}</div>
    </div>
    <div style="padding:22px">
      <h1 style="margin:0 0 10px;color:#191919;font-size:19px">${opts.title}</h1>
      <p style="margin:0 0 16px;color:#191919;font-size:14px;line-height:1.6">${opts.intro}</p>
      ${opts.bodyHtml}
      <div style="text-align:center;margin-top:22px">${buttons}</div>
    </div>
    <div style="background:${BLACK};padding:12px 22px;color:#C4C4C8;font-size:11px;text-align:center">
      ${opts.footerNote ?? "JERETH RENT CAR · Más que un auto, ¡libertad!"}
    </div>
  </div>`;
}

/** Reservation summary table used across the customer emails. */
function summaryTable(r: CustomerNotifiable): string {
  const pickup = [fmtDate(r.pickupDate), r.pickupTime].filter(Boolean).join(" · ");
  const dropoff = [fmtDate(r.dropoffDate), r.dropoffTime].filter(Boolean).join(" · ");
  const rows: [string, string][] = [
    ["Número de reserva", r.code],
    ["Vehículo", r.vehicleTitle],
    ["Recogida", pickup || "—"],
    ["Devolución", dropoff || "—"],
    ["Total", money(r.estimatedTotal)],
  ];
  if (r.depositPaid > 0) {
    rows.push(["Depósito recibido", money(r.depositPaid)]);
    rows.push(["Saldo pendiente", money(r.balanceDue)]);
  }
  const body = rows
    .map(
      ([k, v]) =>
        `<tr><td style="padding:7px 0;color:#6E6E73;font-size:13px;border-bottom:1px solid #F0F0F2">${k}</td><td style="padding:7px 0;color:#191919;font-size:13px;font-weight:600;text-align:right;border-bottom:1px solid #F0F0F2">${v}</td></tr>`
    )
    .join("");
  return `<table style="width:100%;border-collapse:collapse">${body}</table>`;
}

/* ------------------------------ Public API ------------------------------- */

/** "Solicitud de reserva recibida" — sent to the customer on submit. */
export async function sendCustomerRequestReceived(r: CustomerNotifiable): Promise<SendResult> {
  const hi = r.customerName ? `Hola ${r.customerName},` : "Hola,";
  const html = shell({
    badge: "✅ Solicitud recibida",
    title: "Recibimos tu solicitud de reserva",
    intro: `${hi} gracias por reservar con JERETH RENT CAR. Tu solicitud está <strong>pendiente de verificación</strong>; nuestro equipo la revisará y te responderá dentro de un plazo de 0 a 24 horas.`,
    bodyHtml: summaryTable(r),
    ctas: [{ label: "Ver mi reserva", url: reservationUrl(r.token) }],
  });
  return sendCustomerEmail(r, "request_received_customer", `Solicitud de reserva recibida – ${r.code}`, html);
}

/** Correction requested. `message` is the admin's visible instruction. */
export async function sendReservationNeedsFix(r: CustomerNotifiable, message: string): Promise<SendResult> {
  const hi = r.customerName ? `Hola ${r.customerName},` : "Hola,";
  const msgBlock = message
    ? `<div style="background:#FFF6E5;border:1px solid #FFE0A3;border-radius:8px;padding:12px 14px;margin:4px 0 4px;color:#191919;font-size:13px"><strong>Qué debes corregir:</strong><br/>${message}</div>`
    : "";
  const html = shell({
    badge: "✍️ Requiere corrección",
    title: "Necesitamos que revises tu reserva",
    intro: `${hi} para continuar con tu reserva necesitamos que corrijas algunos datos.`,
    bodyHtml: `${msgBlock}${summaryTable(r)}`,
    ctas: [{ label: "Corregir mi información", url: reservationCorrectionUrl(r.token) }],
  });
  return sendCustomerEmail(r, "needs_fix", `Tu reserva necesita una corrección – ${r.code}`, html);
}

/** Official confirmation with the PDF attached. */
export async function sendReservationConfirmed(
  r: CustomerNotifiable,
  pdf: EmailAttachment | null,
  pdfUrl: string | null
): Promise<SendResult> {
  const hi = r.customerName ? `¡Hola ${r.customerName}!` : "¡Hola!";
  const ctas: { label: string; url: string; primary?: boolean }[] = [
    { label: "Ver mi reserva", url: reservationUrl(r.token) },
  ];
  if (pdfUrl) ctas.push({ label: "Descargar confirmación PDF", url: pdfUrl, primary: false });
  const html = shell({
    badge: "✓ Reserva confirmada",
    title: "¡Tu reserva está confirmada!",
    intro: `${hi} nos complace confirmar tu reserva con JERETH RENT CAR. Adjuntamos tu confirmación oficial en PDF con todos los detalles.`,
    bodyHtml: summaryTable(r),
    ctas,
    footerNote: "Te esperamos · JERETH RENT CAR",
  });
  return sendCustomerEmail(
    r,
    "confirmed",
    `Reserva confirmada – ${r.code}`,
    html,
    pdf ? [pdf] : undefined
  );
}

/** Not approved. `reason` is shown only when the admin marked it visible. */
export async function sendReservationRejected(r: CustomerNotifiable, reason: string | null): Promise<SendResult> {
  const hi = r.customerName ? `Hola ${r.customerName},` : "Hola,";
  const reasonBlock = reason
    ? `<div style="background:#FDECEC;border:1px solid #F7C4C4;border-radius:8px;padding:12px 14px;margin:4px 0;color:#191919;font-size:13px"><strong>Motivo:</strong><br/>${reason}</div>`
    : "";
  const html = shell({
    badge: "Solicitud no aprobada",
    title: "No pudimos aprobar tu solicitud",
    intro: `${hi} lamentamos informarte que no pudimos aprobar esta solicitud de reserva. Si tienes dudas, contáctanos y con gusto te ayudamos.`,
    bodyHtml: `${reasonBlock}${summaryTable(r)}`,
    ctas: [{ label: "Ver mi reserva", url: reservationUrl(r.token) }],
  });
  return sendCustomerEmail(r, "rejected", `Sobre tu solicitud de reserva – ${r.code}`, html);
}

/** Reservation cancelled. */
export async function sendReservationCancelled(r: CustomerNotifiable): Promise<SendResult> {
  const hi = r.customerName ? `Hola ${r.customerName},` : "Hola,";
  const html = shell({
    badge: "Reserva cancelada",
    title: "Tu reserva fue cancelada",
    intro: `${hi} tu reserva con JERETH RENT CAR ha sido cancelada. Si crees que se trata de un error o deseas reservar nuevamente, contáctanos.`,
    bodyHtml: summaryTable(r),
    ctas: [{ label: "Ver mi reserva", url: reservationUrl(r.token) }],
  });
  return sendCustomerEmail(r, "cancelled", `Tu reserva fue cancelada – ${r.code}`, html);
}
