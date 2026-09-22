import { cache } from "react";
import prisma from "@/lib/prisma";
import type {
  ReservationStatus,
  ReservationSource,
  PaymentMethod,
} from "@/lib/validations/reservation";

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
  estimatedTotal: number;
  reservationDeposit: number;
  paymentMethod: PaymentMethod | null;
  paymentProofUrl: string | null;
  source: ReservationSource;
  status: ReservationStatus;
  rejectionReason: string | null;
  createdAt: string;
  updatedAt: string;
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
}

/** Public settings view (Configuración de reservas). */
export interface ReservationSettingsData {
  digitalEnabled: boolean;
  defaultDeposit: number;
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
  estimatedTotal: number;
  reservationDeposit: number;
  paymentMethod: PaymentMethod | null;
  paymentProofUrl: string | null;
  source: ReservationSource;
  status: ReservationStatus;
  rejectionReason: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function toAdminReservation(r: ReservationRowWithVehicle): AdminReservation {
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
    estimatedTotal: r.estimatedTotal,
    reservationDeposit: r.reservationDeposit,
    paymentMethod: r.paymentMethod,
    source: r.source,
    status: r.status,
    rejectionReason: r.rejectionReason,
    paymentProofUrl: r.paymentProofUrl,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

/** All reservations for the admin list, newest first. */
export async function listReservationsAdmin(): Promise<AdminReservation[]> {
  const rows = await prisma.reservation.findMany({
    orderBy: { createdAt: "desc" },
    include: { vehicle: { select: { brand: true, model: true, year: true } } },
  });
  return rows.map(toAdminReservation);
}

/** Single reservation for the admin detail/expediente view. */
export async function getReservationById(id: string): Promise<AdminReservation | null> {
  const r = await prisma.reservation.findUnique({
    where: { id },
    include: { vehicle: { select: { brand: true, model: true, year: true } } },
  });
  return r ? toAdminReservation(r) : null;
}

/** Load a reservation by its shareable token, for the digital form. */
export async function getReservationByToken(token: string): Promise<ReservationFormData | null> {
  const r = await prisma.reservation.findUnique({
    where: { token },
    include: {
      vehicle: { select: { brand: true, model: true, year: true, imageUrl: true } },
    },
  });
  if (!r) return null;
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
