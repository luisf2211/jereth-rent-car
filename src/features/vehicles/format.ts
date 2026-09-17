import type { Transmission, Vehicle } from "@/types/vehicle";

export function transmissionLabel(transmission: Transmission): string {
  return transmission === "automatic" ? "Automático" : "Manual";
}

export function vehicleTitle(vehicle: Pick<Vehicle, "brand" | "model" | "year">): string {
  return `${vehicle.brand} ${vehicle.model} ${vehicle.year}`;
}

export function formatDailyPrice(dailyPrice: number): string {
  return `US$${dailyPrice}`;
}
