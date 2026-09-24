import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import ReservationForm from "@/components/public/reservation/ReservationForm";
import ReservationTracking from "@/components/public/reservation/ReservationTracking";
import { getReservationByToken, getReservationSettings } from "@/features/reservations/data";
import { getDeliveryLocations } from "@/features/delivery-locations/data";
import { getI18n } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: t("reservationForm.metaTitle"),
    // This flow is shared via a private link; keep it out of search engines.
    robots: { index: false, follow: false },
  };
}

export default async function ReservarPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ corregir?: string }>;
}) {
  const { token } = await params;
  const { corregir } = await searchParams;
  const { t } = await getI18n();

  const reservation = await getReservationByToken(token);
  if (!reservation) notFound();

  // Correction mode: the admin asked for a fix (status needs_fix) and the
  // customer clicked "Corregir información" (?corregir=1). Show the editable
  // form instead of the read-only tracking view.
  const correctionMode = corregir === "1" && reservation.status === "needs_fix";

  // Once submitted, the same URL becomes a read-only tracking portal — unless
  // we're in correction mode.
  if (reservation.submitted && !correctionMode) {
    return (
      <Box sx={{ bgcolor: "grey.50", minHeight: "100vh", py: { xs: 4, md: 8 } }}>
        <Container maxWidth="sm">
          <Box sx={{ textAlign: "center", mb: { xs: 3, md: 4 } }}>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 800 }}>
              {t("reservationForm.trackingHeading")}
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
              {t("reservationForm.trackingSubheading")}
            </Typography>
          </Box>
          <ReservationTracking reservation={reservation} />
        </Container>
      </Box>
    );
  }

  const [settings, locations] = await Promise.all([
    getReservationSettings(),
    getDeliveryLocations(),
  ]);

  // Only expose the enabled payment methods to the customer.
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

  return (
    <Box sx={{ bgcolor: "grey.50", minHeight: "100vh", py: { xs: 4, md: 8 } }}>
      <Container maxWidth="md">
        <Box sx={{ textAlign: "center", mb: { xs: 3, md: 4 } }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 800 }}>
            {t("reservationForm.pageHeading")}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
            {t("reservationForm.pageSubheadingCode", {
              code: reservation.code,
              title: reservation.vehicleTitle,
            })}
          </Typography>
        </Box>
        <ReservationForm
          reservation={reservation}
          paymentMethods={paymentMethods}
          locations={locationOptions}
          depositOptions={settings.depositOptions}
        />
      </Container>
    </Box>
  );
}
