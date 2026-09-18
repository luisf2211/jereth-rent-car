import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import SettingsSuggestRoundedIcon from "@mui/icons-material/SettingsSuggestRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import CategoryRoundedIcon from "@mui/icons-material/CategoryRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import WhatsAppButton from "@/components/ui/WhatsAppButton";
import VehicleGallery from "@/components/public/VehicleGallery";
import { getVehicleById } from "@/features/vehicles/data";
import { getCompanySettings } from "@/lib/branding";
import {
  categoryLabel,
  formatDailyPrice,
  transmissionLabel,
  vehicleTitle,
  vehicleWhatsAppMessage,
} from "@/features/vehicles/format";

export async function generateMetadata({
  params,
}: PageProps<"/vehicles/[id]">): Promise<Metadata> {
  const { id } = await params;
  const vehicle = await getVehicleById(id);
  if (!vehicle) return { title: "Vehículo" };
  return {
    title: vehicleTitle(vehicle),
    description:
      vehicle.description ??
      `Renta un ${vehicleTitle(vehicle)} en Santo Domingo. ${vehicle.passengers} pasajeros, ${transmissionLabel(
        vehicle.transmission
      )}.`,
  };
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
  const message = vehicleWhatsAppMessage(vehicle);
  const gallery = [vehicle.imageUrl, ...vehicle.images].filter(Boolean);

  const specs = [
    { icon: <CalendarMonthRoundedIcon fontSize="small" />, label: "Año", value: String(vehicle.year) },
    { icon: <PeopleAltRoundedIcon fontSize="small" />, label: "Pasajeros", value: String(vehicle.passengers) },
    { icon: <SettingsSuggestRoundedIcon fontSize="small" />, label: "Transmisión", value: transmissionLabel(vehicle.transmission) },
    { icon: <CategoryRoundedIcon fontSize="small" />, label: "Categoría", value: categoryLabel(vehicle.category) },
  ];

  return (
    <Container sx={{ pt: { xs: 11, md: 14 }, pb: { xs: 6, md: 9 } }}>
      <Button href="/vehicles" startIcon={<ArrowBackRoundedIcon />} color="secondary" sx={{ mb: 2.5 }}>
        Volver a la flota
      </Button>

      <Grid container spacing={{ xs: 3, md: 5 }}>
        {/* Left: gallery + content */}
        <Grid size={{ xs: 12, md: 7 }}>
          <VehicleGallery images={gallery} alt={title} />

          <Box sx={{ mt: 4 }}>
            <Chip label={categoryLabel(vehicle.category)} size="small" sx={{ mb: 1.5 }} />
            <Typography variant="h4" component="h1" sx={{ mb: 1 }}>
              {title}
            </Typography>

            {vehicle.description && (
              <Typography variant="body1" color="text.secondary" sx={{ mt: 2, lineHeight: 1.7, whiteSpace: "pre-line" }}>
                {vehicle.description}
              </Typography>
            )}

            {/* Specs */}
            <Box
              sx={{
                mt: 3,
                display: "grid",
                gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(4, 1fr)" },
                gap: 2,
              }}
            >
              {specs.map((s) => (
                <Box
                  key={s.label}
                  sx={{ p: 2, borderRadius: 3, bgcolor: "grey.50", border: "1px solid", borderColor: "divider" }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, color: "primary.main", mb: 0.5 }}>
                    {s.icon}
                    <Typography variant="caption" color="text.secondary">
                      {s.label}
                    </Typography>
                  </Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    {s.value}
                  </Typography>
                </Box>
              ))}
            </Box>

            {/* Features */}
            {vehicle.features.length > 0 && (
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Facilidades
                </Typography>
                <Grid container spacing={1.5}>
                  {vehicle.features.map((f) => (
                    <Grid key={f} size={{ xs: 12, sm: 6 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <CheckRoundedIcon fontSize="small" sx={{ color: "primary.main" }} />
                        <Typography variant="body2">{f}</Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </Box>
        </Grid>

        {/* Right: sticky reservation card */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Box sx={{ position: { md: "sticky" }, top: { md: 96 } }}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.75, mb: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">
                    Desde
                  </Typography>
                  <Typography variant="h4" component="p" sx={{ fontWeight: 800 }}>
                    {formatDailyPrice(vehicle.dailyPrice)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    / día
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                  Coordina la entrega en el Aeropuerto Las Américas (SDQ) o en Santo Domingo.
                </Typography>

                <WhatsAppButton
                  phoneNumber={whatsappNumber}
                  message={message}
                  label="Consultar disponibilidad"
                  source="vehicle"
                  context={title}
                  size="large"
                  fullWidth
                />

                <Divider sx={{ my: 2.5 }} />

                <Stack spacing={1}>
                  {specs.slice(0, 3).map((s) => (
                    <Box key={s.label} sx={{ display: "flex", justifyContent: "space-between" }}>
                      <Typography variant="body2" color="text.secondary">
                        {s.label}
                      </Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {s.value}
                      </Typography>
                    </Box>
                  ))}
                </Stack>
              </CardContent>
            </Card>
          </Box>
        </Grid>
      </Grid>
    </Container>
  );
}
