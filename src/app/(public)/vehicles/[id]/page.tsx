import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import SettingsSuggestRoundedIcon from "@mui/icons-material/SettingsSuggestRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import WhatsAppButton from "@/components/ui/WhatsAppButton";
import { getVehicleById } from "@/features/vehicles/data";
import { getCompanySettings } from "@/lib/branding";
import {
  formatDailyPrice,
  transmissionLabel,
  vehicleTitle,
} from "@/features/vehicles/format";

export async function generateMetadata({
  params,
}: PageProps<"/vehicles/[id]">): Promise<Metadata> {
  const { id } = await params;
  const vehicle = await getVehicleById(id);
  return { title: vehicle ? vehicleTitle(vehicle) : "Vehículo" };
}

export default async function VehicleDetailPage({ params }: PageProps<"/vehicles/[id]">) {
  const { id } = await params;
  const [vehicle, { whatsappNumber }] = await Promise.all([
    getVehicleById(id),
    getCompanySettings(),
  ]);

  if (!vehicle) {
    notFound();
  }
  const title = vehicleTitle(vehicle);
  const message = `Hola, estoy interesado en rentar el ${title}. ¿Está disponible?`;

  const specs = [
    { icon: <CalendarMonthRoundedIcon />, label: "Año", value: String(vehicle.year) },
    { icon: <SettingsSuggestRoundedIcon />, label: "Transmisión", value: transmissionLabel(vehicle.transmission) },
    { icon: <PeopleAltRoundedIcon />, label: "Pasajeros", value: `${vehicle.passengers}` },
  ];

  return (
    <Container sx={{ py: { xs: 3, md: 5 } }}>
      <Button
        href="/vehicles"
        startIcon={<ArrowBackRoundedIcon />}
        color="secondary"
        sx={{ mb: 3 }}
      >
        Volver a vehículos
      </Button>

      <Grid container spacing={{ xs: 3, md: 5 }}>
        <Grid size={{ xs: 12, md: 7 }}>
          <Box
            component="img"
            src={vehicle.imageUrl}
            alt={title}
            sx={{ width: "100%", borderRadius: 4, aspectRatio: "4 / 3", objectFit: "cover" }}
          />
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Typography variant="h4" component="h1" sx={{ mb: 1 }}>
            {title}
          </Typography>
          <Typography variant="h5" color="primary.main" sx={{ fontWeight: 700, mb: 3 }}>
            {formatDailyPrice(vehicle.dailyPrice)}
            <Typography component="span" variant="body1" color="text.secondary">
              {" "}
              / día
            </Typography>
          </Typography>

          <Divider sx={{ mb: 3 }} />

          <Stack spacing={2} sx={{ mb: 4 }}>
            {specs.map((spec) => (
              <Box key={spec.label} sx={{ display: "flex", alignItems: "center", gap: 1.5, color: "text.secondary" }}>
                {spec.icon}
                <Typography variant="body1" color="text.primary">
                  <strong>{spec.label}:</strong> {spec.value}
                </Typography>
              </Box>
            ))}
          </Stack>

          <WhatsAppButton
            phoneNumber={whatsappNumber}
            message={message}
            label="Reservar por WhatsApp"
            size="large"
            fullWidth
          />
        </Grid>
      </Grid>
    </Container>
  );
}
