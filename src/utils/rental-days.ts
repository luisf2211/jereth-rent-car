/**
 * Rental day calculation shared by the booking tarifario.
 *
 * Industry-standard rule with one local twist requested by the business:
 *  - The base number of days is the calendar difference between the pickup
 *    date and the return date.
 *  - Returning later in the day than you picked up normally costs an extra
 *    day ("late return"). BUT if the return is scheduled BEFORE 5:00 pm, the
 *    day is still charged as a full day and NO extra day is added — i.e. the
 *    courtesy window runs until 17:00. From 17:00 onward, a return past the
 *    pickup time adds one full day.
 *
 * All inputs are strings from <input type="date"> (YYYY-MM-DD) and
 * <input type="time"> (HH:mm). Returns 0 when the range is invalid.
 */

const GRACE_HOUR = 17; // 5:00 pm

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
  /** Optional times (HH:mm). When omitted, only the date difference counts. */
  pickupTime?: string;
  dropoffTime?: string;
}

/**
 * Number of billable days. Minimum 1 when the range is a single valid day.
 */
export function rentalDays({
  pickupDate,
  dropoffDate,
  pickupTime,
  dropoffTime,
}: RentalDaysInput): number {
  const a = parseDate(pickupDate);
  const b = parseDate(dropoffDate);
  if (!a || !b) return 0;

  const dayMs = 86_400_000;
  const calendarDays = Math.round((b.getTime() - a.getTime()) / dayMs);
  if (calendarDays < 0) return 0;

  let days = calendarDays;

  // Late-return surcharge: only when we have both times.
  const pMin = minutesOfDay(pickupTime ?? "");
  const dMin = minutesOfDay(dropoffTime ?? "");
  if (pMin !== null && dMin !== null) {
    const returnsPastPickup = dMin > pMin;
    const returnsAtOrAfterGrace = dMin >= GRACE_HOUR * 60;
    // Before 5pm the day is charged as full but no extra day is added.
    if (returnsPastPickup && returnsAtOrAfterGrace) {
      days += 1;
    }
  }

  // A same-day rental (or any valid selection) is at least one day.
  return Math.max(days, 1);
}
