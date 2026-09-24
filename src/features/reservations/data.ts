import { cache } from "react";
import prisma from "@/lib/prisma";
import type {
  ReservationStatus,
  ReservationSource,
  PaymentMethod,
} from "@/lib/validations/reservation";

/** A single manual payment recorded by the admin (view model). */
export interface ReservationPaymentItem {
  id: string;
  amount: number;
  method: PaymentMethod;
  paidAt: string; // YYYY-MM-DD
  proofUrl: string | null;
  note: string | null;
  createdAt: string;
}

/** Flight fields shared by the admin + form/portal view models. */
export interface FlightFields {
  hasArrivalFlight: boolean;
  arrivalAirline: string;
  arrivalFlightNumber: string;
  arrivalAirport: string;
  arrivalDate: string; // YYYY-MM-DD
  arrivalTime: string;
  arrivalItineraryUrl: string;
  hasReturnFlight: boolean;
  returnAirline: string;
  returnFlightNumber: string;
  returnAirport: string;
  returnDate: string; // YYYY-MM-DD
  returnTime: string;
  returnItineraryUrl: string;
}

/** Admin list/detail view model for a reservation. */
export interface AdminReservation {
  id: string;
  code: string;
  token: string;
  vehicleId: string;
  vehicleTitle: string;
  customerName: string | null;
  email: string | null;
  phone: string | null;
  country: string | null;
  idOrPassport: string | null;
  driverLicense: string | null;
  pickupDate: string | null; // YYYY-MM-DD
  pickupTime: string | null;
  dropoffDate: string | null; // YYYY-MM-DD
  dropoffTime: string | null;
  pickupLocation: string | null;
  dropoffLocation: string | null;
  dailyPrice: number;
  billedDays: number;
  subtotalRent: number;
  pickupFee: number;
  dropoffFee: number;
  estimatedTotal: number;
  reservationDeposit: number;
  depositPaid: number;
  balanceDue: number;
  paymentMethod: PaymentMethod | null;
  paymentProofUrl: string | null;
  source: ReservationSource;
  status: ReservationStatus;
  rejectionReason: string | null;
  statusMessage: string | null;
  statusMessageVisible: boolean;
  specialRequest: string | null;
  createdAt: string;
  updatedAt: string;
  flight: FlightFields;
  // Manual payment history (append-only) recorded by the admin, newest first.
  payments: ReservationPaymentItem[];
  // Total received = initial deposit (depositPaid) + sum of manual payments.
  totalPaid: number;
  // Balance still owed = estimatedTotal − totalPaid (never negative).
  outstandingBalance: number;
}

/** Data needed to render the shared digital reservation form for a token. */
export interface ReservationFormData {
  code: string;
  token: string;
  vehicleId: string;
  vehicleTitle: string;
  vehicleImageUrl: string;
  customerName: string;
  email: string;
  phone: string;
  country: string;
  idOrPassport: string;
  driverLicense: string;
  pickupDate: string;
  pickupTime: string;
  dropoffDate: string;
  dropoffTime: string;
  pickupLocation: string;
  dropoffLocation: string;
  dailyPrice: number;
  reservationDeposit: number;
  status: ReservationStatus;
  /** True once the customer has submitted (status left "link_created"). */
  submitted: boolean;
  // Pricing snapshot (for the tracking view).
  billedDays: number;
  subtotalRent: number;
  pickupFee: number;
  dropoffFee: number;
  estimatedTotal: number;
  depositPaid: number;
  balanceDue: number;
  rejectionReason: string | null;
  statusMessage: string | null;
  statusMessageVisible: boolean;
  specialRequest: string | null;
  paymentProofUrl: string | null;
  /** Official confirmation PDF (set once the admin confirms). */
  confirmationPdfUrl: string | null;
  // Chosen location IDs (to pre-select the selectors in correction mode).
  pickupLocationId: string;
  dropoffLocationId: string;
  flight: FlightFields;
}

/** Public settings view (Configuración de reservas). */
export interface ReservationSettingsData {
  digitalEnabled: boolean;
  defaultDeposit: number;
  depositOptions: number[];
  paymentInstructions: string;
  zelleEnabled: boolean;
  zelleName: string;
  zelleEmail: string;
  zellePhone: string;
  paypalEnabled: boolean;
  paypalEmail: string;
  paypalLink: string;
  cashappEnabled: boolean;
  cashappTag: string;
}

const EMPTY_SETTINGS: ReservationSettingsData = {
  digitalEnabled: false,
  defaultDeposit: 0,
  depositOptions: [100, 150],
  paymentInstructions: "",
  zelleEnabled: false,
  zelleName: "",
  zelleEmail: "",
  zellePhone: "",
  paypalEnabled: false,
  paypalEmail: "",
  paypalLink: "",
  cashappEnabled: false,
  cashappTag: "",
};

function toISODate(d: Date | null): string | null {
  return d ? d.toISOString().slice(0, 10) : null;
}

function vehicleTitleOf(v: { brand: string; model: string; year: number }): string {
  return `${v.brand} ${v.model} ${v.year}`;
}

/** Prisma flight columns → FlightFields view model. */
function flightFieldsOf(r: {
  hasArrivalFlight: boolean;
  arrivalAirline: string | null;
  arrivalFlightNumber: string | null;
  arrivalAirport: string | null;
  arrivalDate: Date | null;
  arrivalTime: string | null;
  arrivalItineraryUrl: string | null;
  hasReturnFlight: boolean;
  returnAirline: string | null;
  returnFlightNumber: string | null;
  returnAirport: string | null;
  returnDate: Date | null;
  returnTime: string | null;
  returnItineraryUrl: string | null;
}): FlightFields {
  return {
    hasArrivalFlight: r.hasArrivalFlight,
    arrivalAirline: r.arrivalAirline ?? "",
    arrivalFlightNumber: r.arrivalFlightNumber ?? "",
    arrivalAirport: r.arrivalAirport ?? "",
    arrivalDate: toISODate(r.arrivalDate) ?? "",
    arrivalTime: r.arrivalTime ?? "",
    arrivalItineraryUrl: r.arrivalItineraryUrl ?? "",
    hasReturnFlight: r.hasReturnFlight,
    returnAirline: r.returnAirline ?? "",
    returnFlightNumber: r.returnFlightNumber ?? "",
    returnAirport: r.returnAirport ?? "",
    returnDate: toISODate(r.returnDate) ?? "",
    returnTime: r.returnTime ?? "",
    returnItineraryUrl: r.returnItineraryUrl ?? "",
  };
}

/** True when a reservation has any flight info registered. */
export function hasFlightInfo(f: FlightFields): boolean {
  return f.hasArrivalFlight || f.hasReturnFlight;
}

/** Prisma row (with vehicle) → AdminReservation view model. */
type ReservationRowWithVehicle = {
  id: string;
  code: string;
  token: string;
  vehicleId: string;
  vehicle: { brand: string; model: string; year: number };
  customerName: string | null;
  email: string | null;
  phone: string | null;
  country: string | null;
  idOrPassport: string | null;
  driverLicense: string | null;
  pickupDate: Date | null;
  pickupTime: string | null;
  dropoffDate: Date | null;
  dropoffTime: string | null;
  pickupLocation: string | null;
  dropoffLocation: string | null;
  dailyPrice: number;
  billedDays: number;
  subtotalRent: number;
  pickupFee: number;
  dropoffFee: number;
  estimatedTotal: number;
  reservationDeposit: number;
  depositPaid: number;
  balanceDue: number;
  paymentMethod: PaymentMethod | null;
  paymentProofUrl: string | null;
  source: ReservationSource;
  status: ReservationStatus;
  rejectionReason: string | null;
  statusMessage: string | null;
  statusMessageVisible: boolean;
  specialRequest: string | null;
  hasArrivalFlight: boolean;
  arrivalAirline: string | null;
  arrivalFlightNumber: string | null;
  arrivalAirport: string | null;
  arrivalDate: Date | null;
  arrivalTime: string | null;
  arrivalItineraryUrl: string | null;
  hasReturnFlight: boolean;
  returnAirline: string | null;
  returnFlightNumber: string | null;
  returnAirport: string | null;
  returnDate: Date | null;
  returnTime: string | null;
  returnItineraryUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  // Optional: only loaded for the detail view (getReservationById).
  payments?: {
    id: string;
    amount: number;
    method: PaymentMethod;
    paidAt: Date;
    proofUrl: string | null;
    note: string | null;
    createdAt: Date;
  }[];
};

function toAdminReservation(r: ReservationRowWithVehicle): AdminReservation {
  // Map + total the manual payment history when it was loaded.
  const payments: ReservationPaymentItem[] = (r.payments ?? []).map((p) => ({
    id: p.id,
    amount: p.amount,
    method: p.method,
    paidAt: toISODate(p.paidAt) ?? "",
    proofUrl: p.proofUrl,
    note: p.note,
    createdAt: p.createdAt.toISOString(),
  }));
  const manualPaid = payments.reduce((sum, p) => sum + p.amount, 0);
  // Total received counts the customer's initial deposit ONCE, plus the manual
  // payments recorded by the admin — never double-counting the same money.
  const totalPaid = r.depositPaid + manualPaid;
  const outstandingBalance = Math.max(r.estimatedTotal - totalPaid, 0);

  return {
    id: r.id,
    code: r.code,
    token: r.token,
    vehicleId: r.vehicleId,
    vehicleTitle: vehicleTitleOf(r.vehicle),
    customerName: r.customerName,
    email: r.email,
    phone: r.phone,
    country: r.country,
    idOrPassport: r.idOrPassport,
    driverLicense: r.driverLicense,
    pickupDate: toISODate(r.pickupDate),
    pickupTime: r.pickupTime,
    dropoffDate: toISODate(r.dropoffDate),
    dropoffTime: r.dropoffTime,
    pickupLocation: r.pickupLocation,
    dropoffLocation: r.dropoffLocation,
    dailyPrice: r.dailyPrice,
    billedDays: r.billedDays,
    subtotalRent: r.subtotalRent,
    pickupFee: r.pickupFee,
    dropoffFee: r.dropoffFee,
    estimatedTotal: r.estimatedTotal,
    reservationDeposit: r.reservationDeposit,
    depositPaid: r.depositPaid,
    balanceDue: r.balanceDue,
    paymentMethod: r.paymentMethod,
    source: r.source,
    status: r.status,
    rejectionReason: r.rejectionReason,
    statusMessage: r.statusMessage,
    statusMessageVisible: r.statusMessageVisible,
    specialRequest: r.specialRequest,
    paymentProofUrl: r.paymentProofUrl,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    flight: flightFieldsOf(r),
    payments,
    totalPaid,
    outstandingBalance,
  };
}

/**
 * All reservations for the admin list. Active reservations WITH a deposit are
 * prioritized (money received), then everything else — all newest-first within
 * each group. Status is independent from this ordering; the deposit is only a
 * visual/priority signal.
 */
export async function listReservationsAdmin(): Promise<AdminReservation[]> {
  const rows = await prisma.reservation.findMany({
    orderBy: { createdAt: "desc" },
    include: { vehicle: { select: { brand: true, model: true, year: true } } },
  });
  const items = rows.map(toAdminReservation);

  // "Active" = not rejected/cancelled. A paid, active reservation floats to top.
  const isActive = (s: AdminReservation["status"]) => s !== "rejected" && s !== "cancelled";
  const priority = (r: AdminReservation) => (r.depositPaid > 0 && isActive(r.status) ? 0 : 1);

  // Stable sort: keep newest-first (already ordered) within each priority band.
  return items
    .map((r, i) => ({ r, i }))
    .sort((a, b) => priority(a.r) - priority(b.r) || a.i - b.i)
    .map(({ r }) => r);
}

/** Single reservation for the admin detail/expediente view. */
export async function getReservationById(id: string): Promise<AdminReservation | null> {
  const r = await prisma.reservation.findUnique({
    where: { id },
    include: {
      vehicle: { select: { brand: true, model: true, year: true } },
      // Manual payment history, newest first, for the Pagos / Depósitos section.
      payments: { orderBy: { paidAt: "desc" } },
    },
  });
  return r ? toAdminReservation(r) : null;
}

/** Load a reservation by its shareable token, for the digital form/portal. */
export async function getReservationByToken(token: string): Promise<ReservationFormData | null> {
  const r = await prisma.reservation.findUnique({
    where: { token },
    include: {
      vehicle: { select: { brand: true, model: true, year: true, imageUrl: true } },
    },
  });
  if (!r) return null;

  // Resolve stored location NAMES back to IDs so the form selectors can be
  // pre-selected in correction mode. Best-effort: unmatched names stay empty.
  const names = [r.pickupLocation, r.dropoffLocation].filter(Boolean) as string[];
  const locs = names.length
    ? await prisma.deliveryLocation.findMany({ where: { name: { in: names } }, select: { id: true, name: true } })
    : [];
  const idByName = new Map(locs.map((l) => [l.name, l.id]));

  return {
    code: r.code,
    token: r.token,
    vehicleId: r.vehicleId,
    vehicleTitle: vehicleTitleOf(r.vehicle),
    vehicleImageUrl: r.vehicle.imageUrl,
    customerName: r.customerName ?? "",
    email: r.email ?? "",
    phone: r.phone ?? "",
    country: r.country ?? "",
    idOrPassport: r.idOrPassport ?? "",
    driverLicense: r.driverLicense ?? "",
    pickupDate: toISODate(r.pickupDate) ?? "",
    pickupTime: r.pickupTime ?? "",
    dropoffDate: toISODate(r.dropoffDate) ?? "",
    dropoffTime: r.dropoffTime ?? "",
    pickupLocation: r.pickupLocation ?? "",
    dropoffLocation: r.dropoffLocation ?? "",
    dailyPrice: r.dailyPrice,
    reservationDeposit: r.reservationDeposit,
    status: r.status,
    // Once submitted the reservation leaves "link_created".
    submitted: r.status !== "link_created",
    billedDays: r.billedDays,
    subtotalRent: r.subtotalRent,
    pickupFee: r.pickupFee,
    dropoffFee: r.dropoffFee,
    estimatedTotal: r.estimatedTotal,
    depositPaid: r.depositPaid,
    balanceDue: r.balanceDue,
    rejectionReason: r.rejectionReason,
    statusMessage: r.statusMessage,
    statusMessageVisible: r.statusMessageVisible,
    specialRequest: r.specialRequest,
    paymentProofUrl: r.paymentProofUrl,
    confirmationPdfUrl: r.confirmationPdfUrl,
    pickupLocationId: (r.pickupLocation && idByName.get(r.pickupLocation)) || "",
    dropoffLocationId: (r.dropoffLocation && idByName.get(r.dropoffLocation)) || "",
    flight: flightFieldsOf(r),
  };
}

/**
 * Reservation settings singleton. Cached per request. Returns sensible empty
 * defaults when no row exists yet.
 */
export const getReservationSettings = cache(async (): Promise<ReservationSettingsData> => {
  const row = await prisma.reservationSettings.findFirst({ orderBy: { createdAt: "asc" } });
  if (!row) return EMPTY_SETTINGS;
  return {
    digitalEnabled: row.digitalEnabled,
    defaultDeposit: row.defaultDeposit,
    // Fall back to the default options when none are configured yet.
    depositOptions: row.depositOptions.length > 0 ? row.depositOptions : [100, 150],
    paymentInstructions: row.paymentInstructions ?? "",
    zelleEnabled: row.zelleEnabled,
    zelleName: row.zelleName ?? "",
    zelleEmail: row.zelleEmail ?? "",
    zellePhone: row.zellePhone ?? "",
    paypalEnabled: row.paypalEnabled,
    paypalEmail: row.paypalEmail ?? "",
    paypalLink: row.paypalLink ?? "",
    cashappEnabled: row.cashappEnabled,
    cashappTag: row.cashappTag ?? "",
  };
});
