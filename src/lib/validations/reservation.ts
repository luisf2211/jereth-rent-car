import { z } from "zod";

/** Reservation lifecycle states (mirror the Prisma enum). */
export const RESERVATION_STATUSES = [
  "link_created",
  "pending",
  "confirmed",
  "needs_fix",
  "rejected",
  "cancelled",
] as const;
export type ReservationStatus = (typeof RESERVATION_STATUSES)[number];

/** Human labels for statuses (admin UI). */
export const RESERVATION_STATUS_LABELS: Record<ReservationStatus, string> = {
  link_created: "Enlace creado",
  pending: "Pendiente",
  confirmed: "Confirmada",
  needs_fix: "Requiere corrección",
  rejected: "Rechazada",
  cancelled: "Cancelada",
};

/**
 * Schema for changing a reservation status from the admin.
 *
 * For "rejected" and "needs_fix" the admin can record a message. When
 * statusMessageVisible is true the customer sees it in their portal; when
 * false it's an internal note only. For other statuses the message is ignored.
 */
export const updateStatusSchema = z.object({
  status: z.enum(RESERVATION_STATUSES),
  statusMessage: z.string().trim().max(1000).optional().or(z.literal("")),
  statusMessageVisible: z.boolean().default(false),
});

export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;

/** Where the reservation came from (mirror the Prisma enum). */
export const RESERVATION_SOURCES = [
  "whatsapp",
  "instagram",
  "referido",
  "recurrente",
  "otro",
  "link",
] as const;
export type ReservationSource = (typeof RESERVATION_SOURCES)[number];

export const RESERVATION_SOURCE_LABELS: Record<ReservationSource, string> = {
  whatsapp: "WhatsApp",
  instagram: "Instagram",
  referido: "Referido",
  recurrente: "Cliente recurrente",
  otro: "Otro",
  link: "Enlace",
};

/** Origins selectable by the admin when creating a link (excludes "link"). */
export const ADMIN_SOURCE_OPTIONS = [
  "whatsapp",
  "instagram",
  "referido",
  "recurrente",
  "otro",
] as const;

/** Payment methods (mirror the Prisma enum). */
export const PAYMENT_METHODS = ["zelle", "paypal", "cashapp", "otro"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  zelle: "Zelle",
  paypal: "PayPal",
  cashapp: "Cash App",
  otro: "Otro",
};

const optionalStr = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));
// Date input value (YYYY-MM-DD) or empty.
const optionalDate = z.string().trim().max(10).optional().or(z.literal(""));
// Time input value (HH:mm) or empty.
const optionalTime = z.string().trim().max(5).optional().or(z.literal(""));

/**
 * Schema the admin uses to CREATE A RESERVATION LINK. Only the vehicle is
 * required; everything else can be pre-filled optionally. Creating a link
 * never blocks a vehicle nor confirms a reservation.
 */
export const createReservationLinkSchema = z.object({
  vehicleId: z.string().trim().min(1, "Selecciona un vehículo"),
  source: z.enum(ADMIN_SOURCE_OPTIONS).default("whatsapp"),
  pickupDate: optionalDate,
  pickupTime: optionalTime,
  dropoffDate: optionalDate,
  dropoffTime: optionalTime,
  pickupLocation: optionalStr(160),
  dropoffLocation: optionalStr(160),
  dailyPrice: z.coerce.number().int().min(0).max(100000).default(0),
  reservationDeposit: z.coerce.number().int().min(0).max(100000).default(0),
});

export type CreateReservationLinkInput = z.infer<typeof createReservationLinkSchema>;

/**
 * Schema the CUSTOMER submits from the digital form (the shared form used both
 * from the admin-generated link and, later, the public button).
 *
 * Pickup/dropoff locations are now selected from the existing DeliveryLocation
 * list, so they are sent as IDs (resolved server-side to name + fee). An empty
 * string means "no location chosen".
 *
 * depositChoice is the amount the customer chose to secure the reservation:
 * 0 means "continue without deposit" (allowed). When > 0, a payment method and
 * proof are expected (validated in the server action against the settings).
 */
export const customerReservationSchema = z.object({
  customerName: z.string().trim().min(2, "El nombre es obligatorio").max(120),
  email: z.string().trim().toLowerCase().email("Email inválido").max(160),
  phone: z.string().trim().min(5, "Teléfono/WhatsApp obligatorio").max(30),
  country: z.string().trim().min(2, "País obligatorio").max(80),
  idOrPassport: z.string().trim().min(3, "Identificación o pasaporte obligatorio").max(60),
  driverLicense: z.string().trim().min(3, "Licencia obligatoria").max(60),
  pickupDate: z.string().trim().min(1, "Fecha de recogida obligatoria").max(10),
  pickupTime: z.string().trim().min(1, "Hora de recogida obligatoria").max(5),
  dropoffDate: z.string().trim().min(1, "Fecha de devolución obligatoria").max(10),
  dropoffTime: z.string().trim().min(1, "Hora de devolución obligatoria").max(5),
  // DeliveryLocation IDs (empty = not chosen).
  pickupLocationId: optionalStr(60),
  dropoffLocationId: optionalStr(60),
  // Chosen deposit amount (0 = without deposit).
  depositChoice: z.coerce.number().int().min(0).max(100000).default(0),
  paymentMethod: z.enum(PAYMENT_METHODS).optional(),
  paymentProofUrl: z.string().trim().url("URL inválida").max(500).optional().or(z.literal("")),
  // Optional special request (empty = none).
  specialRequest: z.string().trim().max(1000).optional().or(z.literal("")),

  // --- Flight info (all optional; only saved when the customer opts in) ---
  hasArrivalFlight: z.boolean().default(false),
  arrivalAirline: optionalStr(120),
  // Flight number: real formats like "AA 987", "B6 244", "UA 1471".
  arrivalFlightNumber: optionalStr(12),
  arrivalAirport: optionalStr(160),
  arrivalDate: optionalDate,
  arrivalTime: optionalTime,
  arrivalItineraryUrl: z.string().trim().url("URL inválida").max(500).optional().or(z.literal("")),

  hasReturnFlight: z.boolean().default(false),
  returnAirline: optionalStr(120),
  returnFlightNumber: optionalStr(12),
  returnAirport: optionalStr(160),
  returnDate: optionalDate,
  returnTime: optionalTime,
  returnItineraryUrl: z.string().trim().url("URL inválida").max(500).optional().or(z.literal("")),
});

export type CustomerReservationInput = z.infer<typeof customerReservationSchema>;

/**
 * Schema for the RESERVATION SETTINGS singleton (Configuración de reservas).
 */
export const reservationSettingsSchema = z.object({
  digitalEnabled: z.boolean().default(false),
  defaultDeposit: z.coerce.number().int().min(0).max(100000).default(0),
  // Configurable deposit amounts (USD) the customer can choose from.
  depositOptions: z.array(z.coerce.number().int().min(1).max(100000)).max(10).default([]),
  paymentInstructions: optionalStr(2000),
  // Zelle
  zelleEnabled: z.boolean().default(false),
  zelleName: optionalStr(160),
  zelleEmail: optionalStr(160),
  zellePhone: optionalStr(60),
  // PayPal
  paypalEnabled: z.boolean().default(false),
  paypalEmail: optionalStr(160),
  paypalLink: z.string().trim().url("URL inválida").max(500).optional().or(z.literal("")),
  // Cash App
  cashappEnabled: z.boolean().default(false),
  cashappTag: optionalStr(60),
});

export type ReservationSettingsInput = z.infer<typeof reservationSettingsSchema>;
