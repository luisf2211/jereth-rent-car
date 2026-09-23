import type { ConfirmationSnapshot } from "@/lib/reservations/confirmation-snapshot";
import { pdfMoney, pdfLongDate, pdfTime12 } from "@/lib/reservations/pdf/format";

/**
 * Template TOKENS. These map 1:1 to the EXISTING reservation data — the
 * ConfirmationSnapshot built at confirmation time (src/lib/reservations/
 * confirmation-snapshot.ts). We do NOT introduce a second data structure:
 * every token resolves against that snapshot.
 *
 * Usage in the builder: the admin inserts `{{group.key}}` into text/heading/
 * image src; resolveTokens replaces them from a snapshot (real reservation or
 * the sample below) for the preview.
 */

export interface TokenDef {
  token: string; // e.g. "{{reservation.code}}"
  label: string; // human label for the insert menu
  group: string; // section in the insert menu
  /** true when this token yields an image URL (for the image element). */
  isImage?: boolean;
}

/** Resolve a single snapshot to a flat map of token → string value. */
export function tokenValues(s: ConfirmationSnapshot): Record<string, string> {
  const arrival = s.arrivalFlight;
  const ret = s.returnFlight;
  return {
    // Reservation
    "reservation.code": s.code,
    "reservation.confirmedDate": pdfLongDate(s.confirmedAt.slice(0, 10)),
    "reservation.status": "CONFIRMADA",
    "reservation.source": s.sourceLabel,
    // Customer
    "customer.fullName": s.customerName,
    "customer.phone": s.phone,
    "customer.email": s.email,
    "customer.country": s.country,
    "customer.idOrPassport": s.idOrPassport,
    "customer.driverLicense": s.driverLicense,
    // Vehicle
    "vehicle.name": s.vehicleTitle,
    "vehicle.image": s.vehicleImageUrl,
    "vehicle.specs": s.vehicleSpecs.join(" · "),
    // Rental
    "rental.pickupDate": pdfLongDate(s.pickupDate),
    "rental.pickupTime": pdfTime12(s.pickupTime),
    "rental.returnDate": pdfLongDate(s.dropoffDate),
    "rental.returnTime": pdfTime12(s.dropoffTime),
    "rental.pickupLocation": s.pickupLocation,
    "rental.dropoffLocation": s.dropoffLocation,
    "rental.days": String(s.billedDays),
    "rental.dailyPrice": pdfMoney(s.dailyPrice),
    // Pricing
    "pricing.subtotal": pdfMoney(s.subtotalRent),
    "pricing.total": pdfMoney(s.estimatedTotal),
    "pricing.deposit": pdfMoney(s.depositPaid),
    "pricing.balance": pdfMoney(s.balanceDue),
    "pricing.paymentMethod": s.paymentMethodLabel,
    // Flight
    "flight.arrivalAirline": arrival?.airline ?? "",
    "flight.arrivalNumber": arrival?.flightNumber ?? "",
    "flight.arrivalAirport": arrival?.airport ?? "",
    "flight.returnAirline": ret?.airline ?? "",
    "flight.returnNumber": ret?.flightNumber ?? "",
    // Other
    "special.request": s.specialRequest,
    "policy.acceptedAt": s.policyAcceptedAt ? pdfLongDate(s.policyAcceptedAt.slice(0, 10)) : "",
    // Company / contact
    "company.whatsapp": s.company.whatsappNumber,
    "company.email": s.company.email,
    "company.website": s.company.website,
    "company.logo": s.company.logoUrl,
  };
}

/** The catalog shown in the "Insertar token" menu, grouped. */
export const TOKEN_CATALOG: TokenDef[] = [
  { group: "Reserva", token: "{{reservation.code}}", label: "Código de reserva" },
  { group: "Reserva", token: "{{reservation.confirmedDate}}", label: "Fecha de confirmación" },
  { group: "Reserva", token: "{{reservation.status}}", label: "Estado" },
  { group: "Reserva", token: "{{reservation.source}}", label: "Origen" },

  { group: "Cliente", token: "{{customer.fullName}}", label: "Nombre completo" },
  { group: "Cliente", token: "{{customer.phone}}", label: "Teléfono / WhatsApp" },
  { group: "Cliente", token: "{{customer.email}}", label: "Correo" },
  { group: "Cliente", token: "{{customer.country}}", label: "País" },
  { group: "Cliente", token: "{{customer.idOrPassport}}", label: "Identificación / pasaporte" },
  { group: "Cliente", token: "{{customer.driverLicense}}", label: "Licencia" },

  { group: "Vehículo", token: "{{vehicle.name}}", label: "Nombre del vehículo" },
  { group: "Vehículo", token: "{{vehicle.image}}", label: "Foto del vehículo (URL)", isImage: true },
  { group: "Vehículo", token: "{{vehicle.specs}}", label: "Especificaciones" },

  { group: "Renta", token: "{{rental.pickupDate}}", label: "Fecha de recogida" },
  { group: "Renta", token: "{{rental.pickupTime}}", label: "Hora de recogida" },
  { group: "Renta", token: "{{rental.returnDate}}", label: "Fecha de devolución" },
  { group: "Renta", token: "{{rental.returnTime}}", label: "Hora de devolución" },
  { group: "Renta", token: "{{rental.pickupLocation}}", label: "Lugar de recogida" },
  { group: "Renta", token: "{{rental.dropoffLocation}}", label: "Lugar de devolución" },
  { group: "Renta", token: "{{rental.days}}", label: "Cantidad de días" },
  { group: "Renta", token: "{{rental.dailyPrice}}", label: "Tarifa diaria" },

  { group: "Pago", token: "{{pricing.subtotal}}", label: "Subtotal" },
  { group: "Pago", token: "{{pricing.total}}", label: "Total" },
  { group: "Pago", token: "{{pricing.deposit}}", label: "Depósito" },
  { group: "Pago", token: "{{pricing.balance}}", label: "Balance pendiente" },
  { group: "Pago", token: "{{pricing.paymentMethod}}", label: "Método de pago" },

  { group: "Vuelo", token: "{{flight.arrivalAirline}}", label: "Aerolínea llegada" },
  { group: "Vuelo", token: "{{flight.arrivalNumber}}", label: "Vuelo llegada" },
  { group: "Vuelo", token: "{{flight.arrivalAirport}}", label: "Aeropuerto llegada" },
  { group: "Vuelo", token: "{{flight.returnAirline}}", label: "Aerolínea regreso" },
  { group: "Vuelo", token: "{{flight.returnNumber}}", label: "Vuelo regreso" },

  { group: "Otros", token: "{{special.request}}", label: "Solicitud especial" },
  { group: "Otros", token: "{{policy.acceptedAt}}", label: "Aceptación de política (fecha)" },

  { group: "Contacto", token: "{{company.whatsapp}}", label: "WhatsApp" },
  { group: "Contacto", token: "{{company.email}}", label: "Correo empresa" },
  { group: "Contacto", token: "{{company.website}}", label: "Sitio web" },
  { group: "Contacto", token: "{{company.logo}}", label: "Logo (URL)", isImage: true },
];

/** Replace every {{token}} in a string using the values map. Unknown tokens
 *  are left as-is so the admin can see typos. */
export function resolveTokens(input: string, values: Record<string, string>): string {
  if (!input) return input;
  return input.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (whole, key: string) => {
    return key in values ? values[key] : whole;
  });
}

/** A representative sample snapshot for the preview (no DB needed). */
export function sampleSnapshot(): ConfirmationSnapshot {
  return {
    version: 1,
    code: "JRC-2026-00125",
    confirmedAt: new Date().toISOString(),
    customerName: "Jorge Luis Cuevas",
    phone: "+1 829-240-3672",
    email: "jorge@example.com",
    country: "Estados Unidos",
    idOrPassport: "••••4582",
    driverLicense: "••••7821",
    pickupDate: "2026-10-20",
    pickupTime: "13:30",
    dropoffDate: "2026-11-04",
    dropoffTime: "13:30",
    pickupLocation: "Aeropuerto Internacional Las Américas (SDQ)",
    dropoffLocation: "Aeropuerto Internacional Las Américas (SDQ)",
    billedDays: 15,
    dailyPrice: 65,
    sourceLabel: "Página web",
    subtotalRent: 975,
    pickupFee: 0,
    dropoffFee: 0,
    estimatedTotal: 975,
    depositPaid: 150,
    balanceDue: 825,
    paymentMethodLabel: "Zelle",
    vehicleTitle: "Kia Sorento 2023",
    vehicleImageUrl:
      "https://vcxmnznhstrjkixnhcod.supabase.co/storage/v1/object/public/media/vehicles/482bd2f8-0680-43f2-a708-c1ac2b0f5692.png",
    vehicleSpecs: ["Automática", "7 Pasajeros", "SUV", "Aire acondicionado"],
    arrivalFlight: {
      airline: "JetBlue",
      flightNumber: "B6 2244",
      airport: "SDQ – Las Américas",
      date: "2026-10-20",
      time: "13:20",
    },
    returnFlight: {
      airline: "JetBlue",
      flightNumber: "B6 2245",
      airport: "SDQ – Las Américas",
      date: "2026-11-04",
      time: "16:30",
    },
    specialRequest: "Evitar ambientadores u olores fuertes. Viajo con un niño pequeño.",
    policyAccepted: true,
    policyAcceptedAt: new Date().toISOString(),
    company: {
      logoUrl: "",
      footerLogoUrl: "",
      whatsappNumber: "+1 829 240 3672",
      phone: "+1 829 240 3672",
      email: "jerethrentcarsrl@gmail.com",
      website: "jerethrentcar.com",
      instagramUrl: "",
      facebookUrl: "",
    },
  };
}
