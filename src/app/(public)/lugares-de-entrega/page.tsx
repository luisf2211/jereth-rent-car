import type { Metadata } from "next";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import Link from "@mui/material/Link";
import Button from "@mui/material/Button";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import FlightLandRoundedIcon from "@mui/icons-material/FlightLandRounded";
import PlaceRoundedIcon from "@mui/icons-material/PlaceRounded";
import WhatsAppButton from "@/components/ui/WhatsAppButton";
import { getDeliveryLocations } from "@/features/delivery-locations/data";
import { getCompanySettings } from "@/lib/branding";

export const metadata: Metadata = {
  title: "Lugares de entrega",
  description:
    "Conoce todos los puntos de entrega y recogida disponibles. Coordinamos la entrega de tu vehículo en el aeropuerto, tu hotel o donde más te convenga.",
};

function formatFee(hasFee: boolean, deliveryFee: number): { label: string; color: "success" | "default" } {
  if (!hasFee) return { label: "Entrega gratis", color: "success" };
  if (deliveryFee > 0) return { label: `+US$${deliveryFee}`, color: "default" };
  return { label: "Cargo adicional", color: "default" };
}

export default async function LugaresDeEntregaPage() {
  const [locations, { whatsappNumber }] = await Promise.all([
    getDeliveryLocations(),
    getCompanySettings(),
  ]);

  const message = "Hola Jereth Rent Car, quisiera coordinar la entrega de un vehículo.";

  return (
    <Box sx={{ pb: { xs: 10, md: 0 } }}>
      <Container sx={{ pt: { xs: 10, md: 13 }, pb: { xs: 6, md: 9 } }}>
        {/* Breadcrumb */}
        <Box sx={{ mb: 3 }}>
          <Button
            component={Link}
            href="/#entrega"
            startIcon={<ArrowBackRoundedIcon />}
            color="secondary"
            size="small"
            sx={{ textTransform: "none", fontWeight: 500 }}
          >
            Volver al inicio
          </Button>
        </Box>

        {/* Header */}
        <Box sx={{ mb: { xs: 4, md: 6 } }}>
          <Typography variant="h3" component="h1" sx={{ fontWeight: 800, mb: 1 }}>
            Lugares de entrega
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" sx={{ maxWidth: 600 }}>
            Coordinamos la entrega y recogida de tu vehículo en los puntos que más te convienen.
            Sin complicaciones, sin filas.
          </Typography>
        </Box>

        {/* Locations grid */}
        {locations.length === 0 ? (
          <Typography color="text.secondary">
            No hay lugares de entrega configurados todavía.
          </Typography>
        ) : (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                md: "repeat(3, 1fr)",
              },
              gap: { xs: 3, md: 4 },
            }}
          >
            {locations.map((loc) => {
              const fee = formatFee(loc.hasFee, loc.deliveryFee);
              // slug: e.g. "aeropuerto-las-americas" — used for deep-link from carousel
              const slug = loc.name
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-|-$/g, "");
              return (
                <Box
                  key={loc.id}
                  id={slug}
                  sx={{
                    borderRadius: 3,
                    border: "1px solid",
                    borderColor: "divider",
                    overflow: "hidden",
                    bgcolor: "background.paper",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  {/* Photo */}
                  <Box sx={{ position: "relative", aspectRatio: "4 / 3", bgcolor: "grey.900" }}>
                    {loc.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={loc.imageUrl}
                        alt={loc.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      />
                    ) : (
                      <Box
                        sx={{
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "rgba(255,255,255,0.35)",
                        }}
                      >
                        {loc.highlighted ? (
                          <FlightLandRoundedIcon sx={{ fontSize: 64 }} />
                        ) : (
                          <PlaceRoundedIcon sx={{ fontSize: 64 }} />
                        )}
                      </Box>
                    )}
                    <Chip
                      size="small"
                      label={fee.label}
                      color={fee.color}
                      sx={{
                        position: "absolute",
                        top: 12,
                        right: 12,
                        fontWeight: 700,
                        ...(fee.color === "default" && {
                          bgcolor: "rgba(10,10,10,0.72)",
                          color: "common.white",
                        }),
                      }}
                    />
                    {loc.highlighted && (
                      <Chip
                        size="small"
                        label="Destacado"
                        sx={{
                          position: "absolute",
                          top: 12,
                          left: 12,
                          bgcolor: "primary.main",
                          color: "primary.contrastText",
                          fontWeight: 700,
                        }}
                      />
                    )}
                  </Box>

                  {/* Body */}
                  <Box sx={{ p: 2.5, flexGrow: 1, display: "flex", flexDirection: "column" }}>
                    <Stack direction="row" spacing={0.75} sx={{ mb: 0.5, alignItems: "center" }}>
                      <Box sx={{ color: "primary.main", display: "flex" }}>
                        {loc.highlighted ? (
                          <FlightLandRoundedIcon fontSize="small" />
                        ) : (
                          <PlaceRoundedIcon fontSize="small" />
                        )}
                      </Box>
                      <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 700 }}>
                        {loc.name}
                      </Typography>
                    </Stack>

                    {loc.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6, mb: 1 }}>
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
                        sx={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 0.5,
                          mt: "auto",
                          pt: 1,
                          color: "primary.main",
                        }}
                      >
                        <PlaceRoundedIcon sx={{ fontSize: 16 }} /> Ver en el mapa
                      </Link>
                    )}
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}

        {/* WhatsApp CTA */}
        <Box sx={{ mt: { xs: 5, md: 7 }, textAlign: "center" }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
            ¿Necesitas entrega en otro punto?
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Escríbenos y coordinamos la entrega donde sea más conveniente para ti.
          </Typography>
          <WhatsAppButton
            phoneNumber={whatsappNumber}
            message={message}
            label="Coordinar entrega por WhatsApp"
            source="delivery"
            size="large"
          />
        </Box>
      </Container>
    </Box>
  );
}
