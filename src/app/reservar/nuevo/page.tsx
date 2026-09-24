import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import ReservationForm from "@/components/public/reservation/ReservationForm";
import type { ReservationFormData } from "@/features/reservations/data";
import { getReservationSettings } from "@/features/reservations/data";
import { getVehicleById } from "@/features/vehicles/data";
import { getDeliveryLocations } from "@/features/delivery-locations/data";
import { vehicleTitle } from "@/features/vehicles/format";

export const metadata: Metadata = {
  title: "Reserva",
  robots: { index: false, follow: false },
};

/**
 * PUBLIC "new reservation" form. Renders the SAME digital form pre-filled with
 * the customer's selection, but WITHOUT creating any reservation row yet. The
 * reservation is persisted ONLY when the customer submits (create mode →
 * createAndSubmitWebReservation), which then redirects to the permanent
 * /reservar/<token> tracking portal. Abandoning this page leaves 0 rows.
 *
 * Manual admin links keep using /reservar/<token> (a pre-existing row).
 */
export default async function NuevaReservaPage({
  searchParams,
}: {
  searchParams: Promise<{
    vehicleId?: string;
    pickupDate?: string;
    pickupTime?: string;
    dropoffDate?: string;
    dropoffTime?: string;
    pickupLocationId?: string;
    dropoffLocationId?: string;
  }>;
}) {
  const sp = await searchParams;
  const vehicleId = sp.vehicleId ?? "";
  if (!vehicleId) notFound();

  const [settings, vehicle, locations] = await Promise.all([
    getReservationSettings(),
    getVehicleById(vehicleId),
    getDeliveryLocations(),
  ]);

  // Respect the digital ON/OFF switch: if disabled, there is no digital form
  // to show — send the customer to the vehicle detail (WhatsApp) instead.
  if (!settings.digitalEnabled) {
    redirect(vehicle ? `/vehicles/${vehicleId}` : "/vehicles");
  }
  if (!vehicle) notFound();

  const paymentMethods = {
    zelle: settings.zelleEnabled
      ? { name: settings.zelleName, email: settings.zelleEmail, phone: settings.zellePhone }
      : null,
    paypal: settings.paypalEnabled
      ? { email: settings.paypalEmail, link: settings.paypalLink }
      : null,
    cashapp: settings.cashappEnabled ? { tag: settings.cashappTag } : null,
    instructions: settings.paymentInstructions,
  };

  const locationOptions = locations.map((l) => ({
    id: l.id,
    name: l.name,
    hasFee: l.hasFee,
    deliveryFee: l.deliveryFee,
    isAirport: l.isAirport,
  }));

  // Resolve the (optional) preselected location names for display continuity.
  const locName = (id?: string) => (id && locations.find((l) => l.id === id)?.name) || "";

  // Synthetic form data — NOT persisted. No token/code yet (assigned on submit).
  const draft: ReservationFormData = {
    code: "",
    token: "",
    vehicleId: vehicle.id,
    vehicleTitle: vehicleTitle(vehicle),
    vehicleImageUrl: vehicle.imageUrl,
    customerName: "",
    email: "",
    phone: "",
    country: "",
    idOrPassport: "",
    driverLicense: "",
    pickupDate: sp.pickupDate ?? "",
    pickupTime: sp.pickupTime ?? "",
    dropoffDate: sp.dropoffDate ?? "",
    dropoffTime: sp.dropoffTime ?? "",
    pickupLocation: locName(sp.pickupLocationId),
    dropoffLocation: locName(sp.dropoffLocationId),
    dailyPrice: vehicle.dailyPrice,
    reservationDeposit: 0,
    status: "link_created",
    submitted: false,
    billedDays: 0,
    subtotalRent: 0,
    pickupFee: 0,
    dropoffFee: 0,
    estimatedTotal: 0,
    depositPaid: 0,
    balanceDue: 0,
    rejectionReason: null,
    statusMessage: null,
    statusMessageVisible: false,
    specialRequest: null,
    paymentProofUrl: null,
    confirmationPdfUrl: null,
    pickupLocationId: sp.pickupLocationId ?? "",
    dropoffLocationId: sp.dropoffLocationId ?? "",
    flight: {
      hasArrivalFlight: false,
      arrivalAirline: "",
      arrivalFlightNumber: "",
      arrivalAirport: "",
      arrivalDate: "",
      arrivalTime: "",
      arrivalItineraryUrl: "",
      hasReturnFlight: false,
      returnAirline: "",
      returnFlightNumber: "",
      returnAirport: "",
      returnDate: "",
      returnTime: "",
      returnItineraryUrl: "",
    },
  };

  return (
    <Box sx={{ bgcolor: "grey.50", minHeight: "100vh", py: { xs: 4, md: 8 } }}>
      <Container maxWidth="md">
        <Box sx={{ textAlign: "center", mb: { xs: 3, md: 4 } }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 800 }}>
            Completa tu reserva
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
            {draft.vehicleTitle}
          </Typography>
        </Box>
        <ReservationForm
          reservation={draft}
          paymentMethods={paymentMethods}
          locations={locationOptions}
          depositOptions={settings.depositOptions}
          createMode
        />
      </Container>
    </Box>
  );
}
