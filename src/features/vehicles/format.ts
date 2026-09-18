import type { Transmission, Vehicle, VehicleCategory } from "@/types/vehicle";

export function transmissionLabel(transmission: Transmission): string {
  return transmission === "automatic" ? "Automático" : "Manual";
}

/** Display order + Spanish labels for categories. */
export const CATEGORY_LABELS: Record<VehicleCategory, string> = {
  economico: "Económicos",
  compacto: "Compactos",
  sedan: "Sedanes",
  suv: "SUVs",
  suv_grande: "SUVs grandes",
  premium: "Premium",
};

export const CATEGORY_ORDER: VehicleCategory[] = [
  "economico",
  "compacto",
  "sedan",
  "suv",
  "suv_grande",
  "premium",
];

export function categoryLabel(category: VehicleCategory): string {
  return CATEGORY_LABELS[category];
}

/** Base name, e.g. "Toyota Corolla". */
export function vehicleName(vehicle: Pick<Vehicle, "brand" | "model">): string {
  return `${vehicle.brand} ${vehicle.model}`;
}

/**
 * Public-facing title. When orSimilar is set, appends "o similar" — the
 * standard rent-car wording so customers know the exact unit may vary.
 */
export function vehicleTitle(
  vehicle: Pick<Vehicle, "brand" | "model" | "orSimilar">
): string {
  const name = vehicleName(vehicle);
  return vehicle.orSimilar ? `${name} o similar` : name;
}

/** Full title with year, used in the admin and detail contexts. */
export function vehicleTitleWithYear(
  vehicle: Pick<Vehicle, "brand" | "model" | "year">
): string {
  return `${vehicle.brand} ${vehicle.model} ${vehicle.year}`;
}

export function formatDailyPrice(dailyPrice: number): string {
  return `US$${dailyPrice}`;
}

/**
 * Builds the WhatsApp message for a vehicle. Uses the vehicle's custom message
 * when set (with {vehicle} replaced by the title), otherwise a sensible default.
 */
export function vehicleWhatsAppMessage(
  vehicle: Pick<Vehicle, "brand" | "model" | "orSimilar"> & { whatsappMessage?: string | null }
): string {
  const title = vehicleTitle(vehicle);
  const custom = vehicle.whatsappMessage?.trim();
  if (custom) return custom.replaceAll("{vehicle}", title);
  return `Hola Jereth Rent Car, me interesa el ${title}. Quisiera consultar disponibilidad.`;
}
