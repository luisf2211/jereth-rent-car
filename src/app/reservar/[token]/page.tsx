import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import ReservationForm from "@/components/public/reservation/ReservationForm";
import { getReservationByToken, getReservationSettings } from "@/features/reservations/data";

export const metadata: Metadata = {
  title: "Completa tu reserva",
  // This flow is shared via a private link; keep it out of search engines.
  robots: { index: false, follow: false },
};

export default async function ReservarPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const reservation = await getReservationByToken(token);
  if (!reservation) notFound();

  const settings = await getReservationSettings();

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

  return (
    <Box sx={{ bgcolor: "grey.50", minHeight: "100vh", py: { xs: 4, md: 8 } }}>
      <Container maxWidth="md">
        <Box sx={{ textAlign: "center", mb: { xs: 3, md: 4 } }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 800 }}>
            Completa tu reserva
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
            Reserva {reservation.code} · {reservation.vehicleTitle}
          </Typography>
        </Box>
        <ReservationForm reservation={reservation} paymentMethods={paymentMethods} />
      </Container>
    </Box>
  );
}
