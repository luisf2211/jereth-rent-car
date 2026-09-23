import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Link from "@mui/material/Link";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import SettingsSuggestRoundedIcon from "@mui/icons-material/SettingsSuggestRounded";
import LocalGasStationRoundedIcon from "@mui/icons-material/LocalGasStationRounded";
import SensorDoorRoundedIcon from "@mui/icons-material/SensorDoorRounded";
import DirectionsCarFilledRoundedIcon from "@mui/icons-material/DirectionsCarFilledRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import CheckRoundedIcon from "@mui/icons-material/CheckRounded";
import PlaceRoundedIcon from "@mui/icons-material/PlaceRounded";
import FlightLandRoundedIcon from "@mui/icons-material/FlightLandRounded";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import WhatsAppButton from "@/components/ui/WhatsAppButton";
import VehicleCard from "@/components/public/VehicleCard";
import VehicleGalleryPro from "@/components/public/vehicle-detail/VehicleGalleryPro";
import VehicleBooking from "@/components/public/vehicle-detail/VehicleBooking";
import VehicleDescription from "@/components/public/vehicle-detail/VehicleDescription";
import DetailReviews from "@/components/public/vehicle-detail/DetailReviews";
import { getVehicleById, getSimilarVehicles, incrementVehicleViews } from "@/features/vehicles/data";
import { extractVehicleId, vehiclePath } from "@/features/vehicles/vehicle-url";
import { getCompanySettings } from "@/lib/branding";
import { getDeliveryLocations } from "@/features/delivery-locations/data";
import { getReservationSettings } from "@/features/reservations/data";
import {
  getRequirements,
  getPolicies,
  getInclusions,
  getReviews,
} from "@/features/content/data";
import {
  categoryLabel,
  formatDailyPrice,
  fuelLabel,
  transmissionLabel,
  vehicleTitle,
  vehicleTitleWithYear,
  vehicleWhatsAppMessage,
} from "@/features/vehicles/format";

export async function generateMetadata({
  params,
}: PageProps<"/vehicles/[id]">): Promise<Metadata> {
  const { id: param } = await params;
  // The route segment is "<slug>-<cuid>" (or a legacy bare cuid); resolve by
  // the embedded cuid so renames never break the lookup.
  const vehicle = await getVehicleById(extractVehicleId(param));
  if (!vehicle) return { title: "Vehículo" };
  return {
    title: vehicleTitle(vehicle),
    description:
      vehicle.description ??
      `Renta un ${vehicleTitle(vehicle)} en Santo Domingo. ${vehicle.passengers} pasajeros, ${transmissionLabel(
        vehicle.transmission
      )}.`,
    // Canonical always points to the current pretty slug for this vehicle.
    alternates: { canonical: vehiclePath(vehicle) },
  };
}

/** Small reusable "section" heading. */
function SectionBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Box component="section" sx={{ mt: { xs: 4, md: 5 } }}>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 2 }}>
        {title}
      </Typography>
      {children}
    </Box>
  );
}

export default async function VehicleDetailPage({ params }: PageProps<"/vehicles/[id]">) {
  const { id: param } = await params;
  // Resolve by the embedded cuid (works for the new "<slug>-<cuid>" form and
  // legacy bare-cuid links alike).
  const id = extractVehicleId(param);
  const vehicle = await getVehicleById(id);
  if (!vehicle) notFound();

  // Normalize the URL to the current canonical slug. If the incoming segment
  // doesn't match (legacy bare cuid, or an old slug after a rename), 301 to the
  // pretty URL. The redirect keeps the same cuid, so nothing breaks.
  const canonicalPath = vehiclePath(vehicle);
  if (`/vehicles/${param}` !== canonicalPath) {
    // 308 permanent redirect so search engines update to the canonical slug.
    permanentRedirect(canonicalPath);
  }

  // Count this view (best-effort) to drive the "most viewed first" fleet order.
  void incrementVehicleViews(id);

  const [
    settings,
    requirements,
    deliveryLocations,
    policies,
    inclusions,
    reviews,
    similar,
    reservationSettings,
  ] = await Promise.all([
    getCompanySettings(),
    getRequirements(),
    getDeliveryLocations(),
    getPolicies(),
    getInclusions(),
    getReviews(),
    getSimilarVehicles(vehicle),
    getReservationSettings(),
  ]);

  const title = vehicleTitle(vehicle);
  const gallery = [vehicle.imageUrl, ...vehicle.images].filter(Boolean);
  const finalMessage = vehicleWhatsAppMessage(vehicle);

  const summary = [
    { icon: <PeopleAltRoundedIcon />, label: `${vehicle.passengers} pasajeros` },
    { icon: <SettingsSuggestRoundedIcon />, label: transmissionLabel(vehicle.transmission) },
    { icon: <LocalGasStationRoundedIcon />, label: fuelLabel(vehicle.fuelType) },
    { icon: <SensorDoorRoundedIcon />, label: `${vehicle.doors} puertas` },
    { icon: <DirectionsCarFilledRoundedIcon />, label: categoryLabel(vehicle.category) },
    { icon: <CalendarMonthRoundedIcon />, label: String(vehicle.year) },
  ];

  const avgRating =
    reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null;

  return (
    <Box sx={{ pb: { xs: 12, md: 0 } }}>
      <Container sx={{ pt: { xs: 10, md: 13 }, pb: { xs: 6, md: 9 } }}>
        {/* Breadcrumb */}
        <Box sx={{ mb: 2, fontSize: 14 }}>
          <Link href="/" underline="hover" color="text.secondary">
            Inicio
          </Link>
          <Box component="span" sx={{ color: "text.disabled", mx: 1 }}>
            /
          </Box>
          <Link href="/vehicles" underline="hover" color="text.secondary">
            Vehículos
          </Link>
          <Box component="span" sx={{ color: "text.disabled", mx: 1 }}>
            /
          </Box>
          <Box component="span" sx={{ color: "text.primary" }}>
            {vehicleTitleWithYear(vehicle)}
          </Box>
        </Box>

        {/* Header */}
        <Box sx={{ mb: 2.5 }}>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 800 }}>
            {title}
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 1.5, mt: 1, color: "text.secondary" }}>
            {avgRating !== null && (
              <Box component="span" sx={{ fontWeight: 600, color: "text.primary" }}>
                ★ {avgRating.toFixed(1)}
                <Box component="span" sx={{ color: "text.secondary", fontWeight: 400 }}>
                  {" "}
                  · {reviews.length} {reviews.length === 1 ? "reseña" : "reseñas"}
                </Box>
              </Box>
            )}
            <Typography variant="body2">{categoryLabel(vehicle.category)}</Typography>
            <Typography variant="body2">·</Typography>
            <Typography variant="body2">{transmissionLabel(vehicle.transmission)}</Typography>
            <Typography variant="body2">·</Typography>
            <Typography variant="body2">{vehicle.passengers} pasajeros</Typography>
            <Chip label="Disponible" size="small" color="success" variant="outlined" sx={{ ml: { sm: 1 } }} />
          </Box>
        </Box>

        {/* Gallery */}
        <VehicleGalleryPro images={gallery} alt={title} imageFits={vehicle.imageFits} />

        {/* Content + booking */}
        <Grid container spacing={{ xs: 3, md: 6 }} sx={{ mt: { xs: 1, md: 2 } }}>
          <Grid size={{ xs: 12, md: 8 }}>
            {/* Summary */}
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr 1fr", sm: "repeat(3, 1fr)" },
                gap: 2.5,
                py: 3,
                borderTop: "1px solid",
                borderBottom: "1px solid",
                borderColor: "divider",
              }}
            >
              {summary.map((s) => (
                <Box key={s.label} sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                  <Box sx={{ color: "text.secondary", display: "flex" }}>{s.icon}</Box>
                  <Typography variant="body2">{s.label}</Typography>
                </Box>
              ))}
            </Box>

            {vehicle.description && (
              <SectionBlock title="Sobre este vehículo">
                <VehicleDescription text={vehicle.description} />
              </SectionBlock>
            )}

            {vehicle.features.length > 0 && (
              <SectionBlock title="Características">
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
              </SectionBlock>
            )}

            {inclusions.length > 0 && (
              <SectionBlock title="Tu renta incluye">
                <Grid container spacing={1.5}>
                  {inclusions.map((i) => (
                    <Grid key={i.id} size={{ xs: 12, sm: 6 }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <CheckRoundedIcon fontSize="small" sx={{ color: "primary.main" }} />
                        <Typography variant="body2">{i.text}</Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </SectionBlock>
            )}

            {requirements.length > 0 && (
              <SectionBlock title="Requisitos para rentar">
                <Stack spacing={1.25}>
                  {requirements.map((r) => (
                    <Box key={r.id} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <CheckRoundedIcon fontSize="small" sx={{ color: "primary.main" }} />
                      <Typography variant="body2">{r.text}</Typography>
                    </Box>
                  ))}
                </Stack>
              </SectionBlock>
            )}

            {deliveryLocations.length > 0 && (
              <SectionBlock title="Recogida y entrega">
                <Stack spacing={1.5}>
                  {deliveryLocations.map((loc) => (
                    <Box key={loc.id} sx={{ display: "flex", alignItems: "flex-start", gap: 1.25 }}>
                      <Box sx={{ color: "primary.main", display: "flex", mt: 0.25 }}>
                        {loc.highlighted ? <FlightLandRoundedIcon fontSize="small" /> : <PlaceRoundedIcon fontSize="small" />}
                      </Box>
                      <Box sx={{ minWidth: 0 }}>
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>
                            {loc.name}
                          </Typography>
                          <Chip
                            size="small"
                            variant="outlined"
                            label={
                              !loc.hasFee
                                ? "Gratis"
                                : loc.deliveryFee > 0
                                  ? `+${formatDailyPrice(loc.deliveryFee)}`
                                  : "Cargo adicional"
                            }
                            color={loc.hasFee ? "default" : "success"}
                          />
                        </Box>
                        {loc.description && (
                          <Typography variant="body2" color="text.secondary">
                            {loc.description}
                          </Typography>
                        )}
                        {loc.mapUrl && (
                          <Link
                            href={loc.mapUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            underline="hover"
                            variant="body2"
                            sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, mt: 0.25 }}
                          >
                            <PlaceRoundedIcon sx={{ fontSize: 16 }} /> Ver en el mapa
                          </Link>
                        )}
                      </Box>
                    </Box>
                  ))}
                </Stack>
              </SectionBlock>
            )}

            {policies.length > 0 && (
              <SectionBlock title="Políticas del vehículo">
                <Accordion
                  disableGutters
                  elevation={0}
                  sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, "&:before": { display: "none" } }}
                >
                  <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
                    <Typography sx={{ fontWeight: 600 }}>Ver políticas</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Stack spacing={1}>
                      {policies.map((p) => (
                        <Typography key={p.id} variant="body2" color="text.secondary">
                          • {p.text}
                        </Typography>
                      ))}
                    </Stack>
                  </AccordionDetails>
                </Accordion>
              </SectionBlock>
            )}

            {reviews.length > 0 && (
              <SectionBlock title="Lo que dicen nuestros clientes">
                <DetailReviews reviews={reviews} />
              </SectionBlock>
            )}
          </Grid>

          {/* Booking (sticky on desktop, fixed bar on mobile) */}
          <Grid size={{ xs: 12, md: 4 }}>
            <VehicleBooking
              vehicleId={vehicle.id}
              vehicleTitle={title}
              dailyPrice={vehicle.dailyPrice}
              whatsappNumber={settings.whatsappNumber}
              digitalEnabled={reservationSettings.digitalEnabled}
              locations={deliveryLocations.map((l) => ({
                id: l.id,
                name: l.name,
                hasFee: l.hasFee,
                deliveryFee: l.deliveryFee,
              }))}
            />
          </Grid>
        </Grid>
      </Container>

      {/* Similar vehicles */}
      {similar.length > 0 && (
        <Box sx={{ bgcolor: "grey.50", py: { xs: 6, md: 8 } }}>
          <Container>
            <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
              También te pueden interesar
            </Typography>
            <Grid container spacing={{ xs: 2.5, md: 3 }} sx={{ alignItems: "stretch" }}>
              {similar.map((s) => (
                <Grid key={s.id} size={{ xs: 12, sm: 6, md: 4 }} sx={{ display: "flex" }}>
                  <VehicleCard vehicle={s} whatsappNumber={settings.whatsappNumber} />
                </Grid>
              ))}
            </Grid>
          </Container>
        </Box>
      )}

      {/* Final CTA */}
      <Container sx={{ py: { xs: 6, md: 9 } }}>
        <Box sx={{ textAlign: "center", maxWidth: 560, mx: "auto" }}>
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
            ¿Listo para tu próximo viaje?
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Reserva tu vehículo de forma rápida y sencilla por WhatsApp.
          </Typography>
          <WhatsAppButton
            phoneNumber={settings.whatsappNumber}
            message={finalMessage}
            label="Reservar por WhatsApp"
            source="final_cta"
            context={title}
            size="large"
          />
        </Box>
      </Container>
    </Box>
  );
}
