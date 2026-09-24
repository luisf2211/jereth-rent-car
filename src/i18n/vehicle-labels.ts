import type { FuelType, Transmission, Vehicle, VehicleCategory } from "@/types/vehicle";
import { vehicleName } from "@/features/vehicles/format";
import type { TFunction } from "./translate";

/**
 * Locale-aware vehicle enum labels + titles for the PUBLIC site.
 *
 * These mirror the Spanish-only helpers in features/vehicles/format.ts, but
 * translate the UI enum labels (category, transmission, fuel) and the "o
 * similar" wording via the dictionary. The vehicle NAME (brand + model + year)
 * is owner data and is NOT translated — only the surrounding wording is.
 *
 * We keep this separate from format.ts so the admin/backoffice keeps using the
 * original Spanish helpers untouched.
 */

const CATEGORY_KEY: Record<VehicleCategory, string> = {
  economico: "vehicle.categoryEconomico",
  compacto: "vehicle.categoryCompacto",
  sedan: "vehicle.categorySedan",
  suv: "vehicle.categorySuv",
  suv_grande: "vehicle.categorySuvGrande",
  premium: "vehicle.categoryPremium",
};

const FUEL_KEY: Record<FuelType, string> = {
  gasolina: "vehicle.fuelGasolina",
  diesel: "vehicle.fuelDiesel",
  hibrido: "vehicle.fuelHibrido",
  electrico: "vehicle.fuelElectrico",
};

export function categoryLabelI18n(t: TFunction, category: VehicleCategory): string {
  return t(CATEGORY_KEY[category]);
}

export function transmissionLabelI18n(t: TFunction, transmission: Transmission): string {
  return t(transmission === "automatic" ? "vehicle.transmissionAutomatic" : "vehicle.transmissionManual");
}

export function fuelLabelI18n(t: TFunction, fuel: FuelType): string {
  return t(FUEL_KEY[fuel]);
}

/** Public title: "Toyota Corolla" + localized "or similar" when applicable. */
export function vehicleTitleI18n(
  t: TFunction,
  vehicle: Pick<Vehicle, "brand" | "model" | "orSimilar">,
): string {
  const name = vehicleName(vehicle);
  return vehicle.orSimilar ? `${name} ${t("vehicle.orSimilar")}` : name;
}

/** Public title including the year + localized "or similar". */
export function vehicleTitleWithYearI18n(
  t: TFunction,
  vehicle: Pick<Vehicle, "brand" | "model" | "year" | "orSimilar">,
): string {
  const base = `${vehicle.brand} ${vehicle.model} ${vehicle.year}`;
  return vehicle.orSimilar ? `${base} ${t("vehicle.orSimilar")}` : base;
}

/**
 * WhatsApp message for a vehicle. The owner's custom message (any language)
 * wins; otherwise a localized default with the vehicle title interpolated.
 */
export function vehicleWhatsAppMessageI18n(
  t: TFunction,
  vehicle: Pick<Vehicle, "brand" | "model" | "orSimilar"> & { whatsappMessage?: string | null },
): string {
  const title = vehicleTitleI18n(t, vehicle);
  const custom = vehicle.whatsappMessage?.trim();
  if (custom) return custom.replaceAll("{vehicle}", title);
  return t("vehicle.defaultWhatsapp", { title });
}
