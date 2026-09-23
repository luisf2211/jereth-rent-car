import "server-only";
import type { ConfirmationSnapshot } from "@/lib/reservations/confirmation-snapshot";
import { RESERVATION_SOURCE_LABELS, PAYMENT_METHOD_LABELS, type ReservationSource, type PaymentMethod } from "@/lib/validations/reservation";
import { transmissionLabel, categoryLabel } from "@/features/vehicles/format";
import type { CompanySettings } from "@/types/branding";

function toISODate(d: Date | null): string {
  return d ? d.toISOString().slice(0, 10) : "";
}

/** Vehicle shape needed for the snapshot (subset of the Prisma model). */
export interface SnapshotVehicle {
  brand: string;
  model: string;
  year: number;
  category: string;
  transmission: string;
  passengers: number;
  imageUrl: string;
  /** Dedicated documents image; when present it's preferred over imageUrl. */
  documentImageUrl?: string | null;
  features: string[];
}

/** Reservation shape needed for the snapshot (subset of the Prisma row). */
export interface SnapshotReservation {
  code: string;
  customerName: string | null;
  phone: string | null;
  email: string | null;
  country: string | null;
  idOrPassport: string | null;
  driverLicense: string | null;
  pickupDate: Date | null;
  pickupTime: string | null;
  dropoffDate: Date | null;
  dropoffTime: string | null;
  pickupLocation: string | null;
  dropoffLocation: string | null;
  billedDays: number;
  dailyPrice: number;
  subtotalRent: number;
  pickupFee: number;
  dropoffFee: number;
  estimatedTotal: number;
  depositPaid: number;
  balanceDue: number;
  paymentMethod: string | null;
  source: string;
  specialRequest: string | null;
  policyAccepted: boolean;
  policyAcceptedAt: Date | null;
  hasArrivalFlight: boolean;
  arrivalAirline: string | null;
  arrivalFlightNumber: string | null;
  arrivalAirport: string | null;
  arrivalDate: Date | null;
  arrivalTime: string | null;
  hasReturnFlight: boolean;
  returnAirline: string | null;
  returnFlightNumber: string | null;
  returnAirport: string | null;
  returnDate: Date | null;
  returnTime: string | null;
}

/** Builds the immutable confirmation snapshot from live data at confirm time. */
export function buildConfirmationSnapshot(
  r: SnapshotReservation,
  vehicle: SnapshotVehicle,
  company: CompanySettings,
  confirmedAt: Date
): ConfirmationSnapshot {
  const specs: string[] = [];
  // e.g. "Automática", "7 Pasajeros", category, "Aire acondicionado" (if a feature)
  specs.push(transmissionLabel(vehicle.transmission as "automatic" | "manual"));
  specs.push(`${vehicle.passengers} Pasajeros`);
  specs.push(categoryLabel(vehicle.category as "economico" | "compacto" | "sedan" | "suv" | "suv_grande" | "premium"));
  const ac = vehicle.features.find((f) => /aire/i.test(f));
  if (ac) specs.push(ac);

  return {
    version: 1,
    code: r.code,
    confirmedAt: confirmedAt.toISOString(),

    customerName: r.customerName ?? "",
    phone: r.phone ?? "",
    email: r.email ?? "",
    country: r.country ?? "",
    idOrPassport: r.idOrPassport ?? "",
    driverLicense: r.driverLicense ?? "",

    pickupDate: toISODate(r.pickupDate),
    pickupTime: r.pickupTime ?? "",
    dropoffDate: toISODate(r.dropoffDate),
    dropoffTime: r.dropoffTime ?? "",
    pickupLocation: r.pickupLocation ?? "",
    dropoffLocation: r.dropoffLocation ?? "",
    billedDays: r.billedDays,
    dailyPrice: r.dailyPrice,
    sourceLabel: RESERVATION_SOURCE_LABELS[r.source as ReservationSource] ?? r.source,

    subtotalRent: r.subtotalRent || r.dailyPrice * r.billedDays,
    pickupFee: r.pickupFee,
    dropoffFee: r.dropoffFee,
    estimatedTotal: r.estimatedTotal,
    depositPaid: r.depositPaid,
    balanceDue: r.balanceDue,
    paymentMethodLabel: r.paymentMethod ? PAYMENT_METHOD_LABELS[r.paymentMethod as PaymentMethod] ?? "" : "",

    vehicleTitle: `${vehicle.brand} ${vehicle.model} ${vehicle.year}`,
    // Prefer the dedicated documents image; fall back to the catalog cover.
    vehicleImageUrl: vehicle.documentImageUrl || vehicle.imageUrl,
    vehicleSpecs: specs,

    arrivalFlight: r.hasArrivalFlight
      ? {
          airline: r.arrivalAirline ?? "",
          flightNumber: r.arrivalFlightNumber ?? "",
          airport: r.arrivalAirport ?? "",
          date: toISODate(r.arrivalDate),
          time: r.arrivalTime ?? "",
        }
      : null,
    returnFlight: r.hasReturnFlight
      ? {
          airline: r.returnAirline ?? "",
          flightNumber: r.returnFlightNumber ?? "",
          airport: r.returnAirport ?? "",
          date: toISODate(r.returnDate),
          time: r.returnTime ?? "",
        }
      : null,

    specialRequest: r.specialRequest ?? "",

    policyAccepted: r.policyAccepted,
    policyAcceptedAt: r.policyAcceptedAt ? r.policyAcceptedAt.toISOString() : "",

    company: {
      logoUrl: company.logoUrl ?? "",
      footerLogoUrl: company.footerLogoUrl ?? "",
      whatsappNumber: company.phone ?? company.whatsappNumber ?? "",
      phone: company.phone ?? "",
      email: company.contactEmail ?? "",
      website: "jerethrentcar.com",
      instagramUrl: company.socialLinks.instagram ?? "",
      facebookUrl: company.socialLinks.facebook ?? "",
    },
  };
}
