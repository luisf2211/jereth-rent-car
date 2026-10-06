/**
 * Operational helpers for the ADMIN reservations list: derive COMPUTED badges,
 * an operational phase, and a smart sort key from the dates already stored on
 * each reservation. Nothing here is persisted — everything is recalculated on
 * each render from pickup/dropoff dates + the reservation status.
 *
 * TIMEZONE: all "today / tomorrow / in N days" reasoning is done in the
 * operational timezone of the Dominican Republic (America/Santo_Domingo), so
 * the day boundary (midnight) matches the business day, independent of the
 * admin's device/browser timezone or the server's UTC clock. The DR does not
 * observe DST (fixed UTC−4), but we still resolve the offset via Intl so this
 * stays correct if that ever changes.
 *
 * No external date libraries (none are installed). Plain Intl + Date math.
 */

import type { ReservationStatus } from "@/lib/validations/reservation";

const OP_TZ = "America/Santo_Domingo";
const DAY_MS = 86_400_000;

/**
 * The "civil day number" for a Date, as seen in the operational timezone.
 * Returns the count of whole days since the Unix epoch for that TZ's calendar
 * day, so two instants on the same DR calendar day yield the same number and
 * subtracting two numbers gives a whole-day difference. Implemented by reading
 * the Y/M/D that Intl renders for the TZ and converting to a UTC day index.
 */
function civilDayNumber(instant: Date): number {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: OP_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instant);
  const y = Number(parts.find((p) => p.type === "year")?.value);
  const m = Number(parts.find((p) => p.type === "month")?.value);
  const d = Number(parts.find((p) => p.type === "day")?.value);
  // Day index since epoch for that calendar date (TZ-independent arithmetic).
  return Math.floor(Date.UTC(y, m - 1, d) / DAY_MS);
}

/** Today's civil day number in the operational timezone. */
export function todayOpDayNumber(now: Date = new Date()): number {
  return civilDayNumber(now);
}

/**
 * Civil day number for a stored reservation date string ("YYYY-MM-DD").
 * These strings are already date-only (no time), so we treat them as that
 * calendar day directly (no TZ shift needed — the string IS the civil day).
 */
function dayNumberFromISODate(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return null;
  return Math.floor(Date.UTC(y, m - 1, d) / DAY_MS);
}

/** Minutes since midnight for an "HH:mm" string, or null when empty/invalid. */
function minutesOfDay(time: string | null | undefined): number | null {
  if (!time) return null;
  const [h, min] = time.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(min)) return null;
  return h * 60 + min;
}

const MONTHS_ES_SHORT = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

/**
 * Human-friendly admin label for a stored date ("YYYY-MM-DD") + optional time
 * ("HH:mm"). Spanish, 12-hour AM/PM. Example: "7 oct, 10:00 AM".
 *
 * This is PRESENTATION ONLY — it never changes how dates are stored or how
 * billed days are computed. The date string is already a civil day (no TZ
 * shift needed); the time is shown as the stored wall-clock time, which is the
 * America/Santo_Domingo operational time the admin entered.
 */
export function humanDateTime(iso: string | null | undefined, time?: string | null): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return "—";
  const datePart = `${d} ${MONTHS_ES_SHORT[m - 1] ?? ""}`.trim();
  const t = minutesOfDay(time);
  if (t === null) return datePart;
  const h24 = Math.floor(t / 60);
  const min = t % 60;
  const period = h24 >= 12 ? "PM" : "AM";
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  return `${datePart}, ${h12}:${String(min).padStart(2, "0")} ${period}`;
}

/** Current minutes since midnight in the operational timezone. */
function nowMinutesOp(now: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: OP_TZ,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const h = Number(parts.find((p) => p.type === "hour")?.value);
  const m = Number(parts.find((p) => p.type === "minute")?.value);
  return (Number.isNaN(h) ? 0 : h) * 60 + (Number.isNaN(m) ? 0 : m);
}

/**
 * Operational phase of a reservation, derived (never stored). Only meaningful
 * for reservations that are part of the active rental flow; cancelled/rejected
 * are reported as "closed".
 */
export type ReservationPhase =
  | "needs_action" // requires admin attention (pending / needs_fix / link_created)
  | "upcoming" // confirmed, pickup is in the future (or today, not yet started)
  | "in_progress" // confirmed, between pickup and dropoff
  | "pending_finalize" // confirmed, dropoff already passed but not finalized
  | "closed"; // cancelled / rejected (and, later, finished)

/** A computed operational badge shown on the card. */
export interface OpBadge {
  /** Short uppercase label, e.g. "HOY", "EN 3 DÍAS". */
  label: string;
  /** MUI color intent. */
  color: "default" | "info" | "warning" | "success" | "error";
  /** filled gives more weight for urgent states. */
  variant: "filled" | "outlined";
}

export interface ReservationOps {
  phase: ReservationPhase;
  badges: OpBadge[];
  /**
   * True when a confirmed reservation is past its dropoff and should be
   * finalized by the admin (drives the "Finalizar reserva" button).
   */
  pendingFinalize: boolean;
  /** Sort key — lower sorts first. See computeReservationOps for the bands. */
  sortKey: number;
}

/** The minimal reservation shape this module needs. */
export interface OpsInput {
  status: ReservationStatus;
  pickupDate: string | null;
  pickupTime: string | null;
  dropoffDate: string | null;
  dropoffTime: string | null;
}

const STATUSES_NEEDS_ACTION: ReservationStatus[] = ["pending", "needs_fix", "link_created"];
// Terminal states: finished rentals and cancelled/rejected requests. They get
// no operational badges and sort to the bottom (shown via their own tabs).
const STATUSES_CLOSED: ReservationStatus[] = ["cancelled", "rejected", "finished"];

/**
 * Build the "in N days" / "HOY" / "MAÑANA" label from a day delta.
 * delta = targetDay − today (in civil days).
 */
function relativeDayLabel(delta: number): string {
  if (delta === 0) return "HOY";
  if (delta === 1) return "MAÑANA";
  if (delta > 1) return `EN ${delta} DÍAS`;
  // Past days (negative) are not labeled as upcoming; callers handle that.
  return "";
}

/**
 * Compute the operational phase, badges and sort key for a reservation.
 *
 * Ordering bands (sortKey), lowest first:
 *   0  needs_action           → always first (requires admin action)
 *   1  pending_finalize       → confirmed but past dropoff, awaiting finalize
 *   2  in_progress            → rental currently active
 *   3  upcoming               → confirmed future rentals, soonest pickup first
 *   8  closed (cancelled/rejected / no dates) → bottom
 * Within band 3 (upcoming) the pickup day number is added so the nearest
 * pickup sorts first; within pending/in_progress the dropoff day orders them.
 */
export function computeReservationOps(r: OpsInput, now: Date = new Date()): ReservationOps {
  const today = todayOpDayNumber(now);
  const pickupDay = dayNumberFromISODate(r.pickupDate);
  const dropoffDay = dayNumberFromISODate(r.dropoffDate);
  const badges: OpBadge[] = [];

  // Closed states (cancelled / rejected): no operational badges, sort last.
  if (STATUSES_CLOSED.includes(r.status)) {
    return { phase: "closed", badges, pendingFinalize: false, sortKey: 8_000_000 };
  }

  // Needs action: pending / needs_fix / link_created. Always first.
  if (STATUSES_NEEDS_ACTION.includes(r.status)) {
    // Still surface a pickup-proximity hint when a date is known.
    if (pickupDay !== null) {
      const delta = pickupDay - today;
      const rel = relativeDayLabel(delta);
      if (rel) badges.push({ label: rel, color: delta === 0 ? "error" : "info", variant: delta <= 1 ? "filled" : "outlined" });
    }
    // Secondary ordering by soonest pickup, then unknown-date ones.
    const within = pickupDay !== null ? pickupDay : 9_999_999;
    return { phase: "needs_action", badges, pendingFinalize: false, sortKey: 0 + within / 1e9 };
  }

  // From here, status === "confirmed" (the only remaining active status).
  // Without dates we can't reason operationally; keep it visible but low.
  if (pickupDay === null || dropoffDay === null) {
    return { phase: "upcoming", badges, pendingFinalize: false, sortKey: 3_500_000 };
  }

  const pickupDelta = pickupDay - today;
  const dropoffDelta = dropoffDay - today;

  // PENDING FINALIZE: dropoff day already passed (strictly before today), OR
  // dropoff is today but the dropoff time has already elapsed in DR time.
  let pastDropoff = dropoffDelta < 0;
  if (!pastDropoff && dropoffDelta === 0) {
    const dMin = minutesOfDay(r.dropoffTime);
    if (dMin !== null && nowMinutesOp(now) >= dMin) pastDropoff = true;
  }
  if (pastDropoff) {
    badges.push({ label: "PENDIENTE DE FINALIZAR", color: "error", variant: "filled" });
    // Order the oldest overdue first (more negative dropoff → smaller key).
    return { phase: "pending_finalize", badges, pendingFinalize: true, sortKey: 1_000_000 + dropoffDay / 1e9 };
  }

  // Determine whether the pickup moment has actually arrived. For a pickup
  // scheduled TODAY we also look at the pickup time: before that time it's an
  // upcoming delivery ("HOY"); at/after it the rental is considered started
  // ("EN CURSO"). A pickup day in the past is always started.
  let pickupStarted = pickupDelta < 0;
  if (!pickupStarted && pickupDelta === 0) {
    const pMin = minutesOfDay(r.pickupTime);
    // No pickup time → treat a same-day pickup as not yet started (show HOY).
    pickupStarted = pMin !== null && nowMinutesOp(now) >= pMin;
  }

  // IN PROGRESS: pickup already happened and not past dropoff.
  if (pickupStarted) {
    badges.push({ label: "EN CURSO", color: "success", variant: "filled" });
    // Return-today hint when the dropoff is today.
    if (dropoffDelta === 0) {
      badges.push({ label: "DEVOLUCIÓN HOY", color: "warning", variant: "filled" });
    }
    return { phase: "in_progress", badges, pendingFinalize: false, sortKey: 2_000_000 + dropoffDay / 1e9 };
  }

  // UPCOMING: confirmed, pickup not yet started. HOY/MAÑANA/EN N DÍAS. When
  // the pickup is today-but-not-started we also surface DEVOLUCIÓN HOY only if
  // dropoff were today (degenerate same-day rental), handled by the hint below.
  const rel = relativeDayLabel(pickupDelta);
  if (rel) {
    badges.push({ label: rel, color: pickupDelta <= 1 ? "warning" : "info", variant: pickupDelta <= 1 ? "filled" : "outlined" });
  }
  return { phase: "upcoming", badges, pendingFinalize: false, sortKey: 3_000_000 + pickupDay / 1e9 };
}
