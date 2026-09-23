import type { Vehicle } from "@/types/vehicle";

/**
 * Vehicle URL strategy: `/vehicles/<slug>-<cuid>`.
 *
 * The trailing cuid is the REAL, immutable identifier used to resolve the
 * vehicle (so existing links and reservations never break on rename). The
 * leading slug is purely decorative/SEO and is derived from brand-model-year
 * at render time — it is NOT stored in the database, so renaming a vehicle
 * simply produces a new pretty URL while the old one still resolves by its
 * embedded cuid.
 *
 * Backwards compatible: a legacy `/vehicles/<cuid>` URL (no slug) still works,
 * because extractVehicleId returns the trailing token either way. cuids are
 * lowercase alphanumeric with NO dashes, so the last dash-separated segment is
 * always the id.
 */

/** URL-safe slug from arbitrary text (accents stripped, spaces→dashes). */
export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // strip diacritics (á→a, ñ→n handled below)
    .replace(/ñ/gi, "n")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-") // non-alphanumerics → single dash
    .replace(/^-+|-+$/g, ""); // trim leading/trailing dashes
}

/** The human-readable slug part for a vehicle: "toyota-corolla-2023". */
export function vehicleSlug(vehicle: Pick<Vehicle, "brand" | "model" | "year">): string {
  return slugify(`${vehicle.brand} ${vehicle.model} ${vehicle.year}`);
}

/** Canonical public path for a vehicle: "/vehicles/toyota-corolla-2023-<cuid>". */
export function vehiclePath(vehicle: Pick<Vehicle, "id" | "brand" | "model" | "year">): string {
  const slug = vehicleSlug(vehicle);
  return slug ? `/vehicles/${slug}-${vehicle.id}` : `/vehicles/${vehicle.id}`;
}

/**
 * Extracts the vehicle cuid from a `[id]` route param, which may be either the
 * new `<slug>-<cuid>` form or a legacy bare `<cuid>`. Since a cuid contains no
 * dash, the id is always the substring after the LAST dash (or the whole value
 * when there is no dash).
 */
export function extractVehicleId(param: string): string {
  const decoded = decodeURIComponent(param);
  const lastDash = decoded.lastIndexOf("-");
  return lastDash === -1 ? decoded : decoded.slice(lastDash + 1);
}

/**
 * sessionStorage key used to remember which vehicle the admin was editing, so
 * the admin list can scroll it back into view on "Volver a vehículos".
 */
export const LAST_EDITED_VEHICLE_KEY = "admin:lastEditedVehicleId";
