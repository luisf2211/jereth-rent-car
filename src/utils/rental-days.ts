/**
 * Rental day calculation shared by the booking tarifario.
 *
 * Business rules (requested by the owner):
 *  - Both the pickup day and the return day count, so the base number of days
 *    is the calendar difference PLUS ONE: (dropoff − pickup) + 1. Example:
 *    Sep 30 → Oct 5 is 6 days (Sep 30, Oct 1, 2, 3, 4, 5).
 *  - PICKUP TIME rule (5:00 pm cutoff):
 *      · Pickup BEFORE 5:00 pm  → the pickup day IS charged (full day).
 *      · Pickup AT/AFTER 5:00 pm → the pickup day is NOT charged; billing
 *        starts the next day (one day is subtracted).
 *    So Sep 30 → Oct 5 is 6 days when picking up before 5pm, and 5 days when
 *    picking up at/after 5pm.
 *  - RETURN TIME does NOT affect the number of billed days. Only the return
 *    DATE matters.
 *  - The minimum billable rental is 3 days; this is validated on the real
 *    billable days AFTER applying the 5:00 pm pickup rule (see MIN_RENTAL_DAYS
 *    and meetsMinimumRental).
 *
 * All inputs are strings from <input type="date"> (YYYY-MM-DD) and
 * <input type="time"> (HH:mm). Returns 0 when the range is invalid.
 */

const GRACE_HOUR = 17; // 5:00 pm cutoff for the pickup day

/** Minimum billable rental, in days. */
export const MIN_RENTAL_DAYS = 3;

function parseDate(iso: string): Date | null {
  if (!iso) return null;
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return null;
  const date = new Date(y, m - 1, d);
  return Number.isNaN(date.getTime()) ? null : date;
}

/** Minutes since midnight for an HH:mm string, or null if empty/invalid. */
function minutesOfDay(time: string): number | null {
  if (!time) return null;
  const [h, min] = time.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(min)) return null;
  return h * 60 + min;
}

export interface RentalDaysInput {
  pickupDate: string;
  dropoffDate: string;
  /** Pickup time (HH:mm). Drives the 5:00 pm rule. */
  pickupTime?: string;
  /** Return time (HH:mm). Ignored for billing — only the date matters. */
  dropoffTime?: string;
}

/**
 * Number of billable days after applying the 5:00 pm pickup rule.
 * Returns 0 when the range is invalid or the result would be non-positive.
 */
export function rentalDays({
  pickupDate,
  dropoffDate,
  pickupTime,
}: RentalDaysInput): number {
  const a = parseDate(pickupDate);
  const b = parseDate(dropoffDate);
  if (!a || !b) return 0;

  const dayMs = 86_400_000;
  const calendarDays = Math.round((b.getTime() - a.getTime()) / dayMs);
  if (calendarDays <= 0) return 0;

  // Both endpoints count: the pickup day AND the return day are rental days,
  // so the base is the calendar span plus one. (Sep 30 → Oct 5 = 6 days.)
  let days = calendarDays + 1;

  // 5:00 pm pickup rule: a pickup at/after 17:00 doesn't charge the pickup
  // day, so billing starts the next day → subtract one day.
  const pMin = minutesOfDay(pickupTime ?? "");
  if (pMin !== null && pMin >= GRACE_HOUR * 60) {
    days -= 1;
  }

  // Never negative. (May be below MIN_RENTAL_DAYS; the form validates that.)
  return Math.max(days, 0);
}

/** True when the billable days meet the 3-day minimum. */
export function meetsMinimumRental(days: number): boolean {
  return days >= MIN_RENTAL_DAYS;
}
