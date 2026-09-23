/**
 * Immutable snapshot of the data used to render the official confirmation PDF
 * at the exact moment the admin confirms. Persisted on the reservation
 * (confirmationSnapshot Json) so the document never silently changes if the
 * reservation is edited later. Plain data only (no React/DOM) — importable
 * anywhere (server actions, PDF renderer).
 */

export interface ConfirmationFlightLeg {
  airline: string;
  flightNumber: string;
  airport: string;
  date: string;
  time: string;
}

export interface ConfirmationSnapshot {
  /** Snapshot format version, for future revisions. */
  version: 1;
  code: string;
  confirmedAt: string; // ISO

  // Customer
  customerName: string;
  phone: string;
  email: string;
  country: string;
  idOrPassport: string;
  driverLicense: string;

  // Rental
  pickupDate: string;
  pickupTime: string;
  dropoffDate: string;
  dropoffTime: string;
  pickupLocation: string;
  dropoffLocation: string;
  billedDays: number;
  dailyPrice: number;
  sourceLabel: string;

  // Payment
  subtotalRent: number;
  pickupFee: number;
  dropoffFee: number;
  estimatedTotal: number;
  depositPaid: number;
  balanceDue: number;
  paymentMethodLabel: string;

  // Vehicle (real data + real photo URL)
  vehicleTitle: string;
  vehicleImageUrl: string;
  vehicleSpecs: string[]; // e.g. ["Automática", "7 Pasajeros", "Aire acondicionado"]

  // Flight (only when present)
  arrivalFlight: ConfirmationFlightLeg | null;
  returnFlight: ConfirmationFlightLeg | null;

  // Special request (only when present)
  specialRequest: string;

  // Policy acceptance
  policyAccepted: boolean;
  policyAcceptedAt: string; // ISO or ""

  // Company/contact (real data captured at confirmation time)
  company: {
    logoUrl: string;
    footerLogoUrl: string;
    whatsappNumber: string;
    phone: string;
    email: string;
    website: string;
    instagramUrl: string;
    facebookUrl: string;
  };
}
