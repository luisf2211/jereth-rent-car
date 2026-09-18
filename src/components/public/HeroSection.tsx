import * as React from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import FlightLandRoundedIcon from "@mui/icons-material/FlightLandRounded";
import PlaceRoundedIcon from "@mui/icons-material/PlaceRounded";
import ChatRoundedIcon from "@mui/icons-material/ChatRounded";
import { getCompanySettings } from "@/lib/branding";
import WhatsAppButton from "@/components/ui/WhatsAppButton";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1400&q=80";

const TRUST = [
  { icon: <FlightLandRoundedIcon fontSize="small" />, label: "Entrega en SDQ" },
  { icon: <PlaceRoundedIcon fontSize="small" />, label: "Santo Domingo" },
  { icon: <ChatRoundedIcon fontSize="small" />, label: "Reserva por WhatsApp" },
];

/**
 * Editorial split hero: message + CTAs on the left, a treated vehicle image on
 * the right. Dark canvas so the fixed transparent header reads as white.
 * Mobile stacks image → copy.
 */
export default async function HeroSection() {
  const { whatsappNumber } = await getCompanySettings();
  const heroMessage = "Hola Jereth Rent Car, quiero rentar un vehículo. ¿Me ayudan?";

  return (
    <Box
      component="section"
      sx={{
        position: "relative",
        bgcolor: "#0A0A0A",
        color: "common.white",
        pt: { xs: 12, md: 16 },
        pb: { xs: 6, md: 10 },
        overflow: "hidden",
      }}
    >
      {/* Soft magenta glow accent — deliberate, not filler. */}
      <Box
        aria-hidden
        sx={{
          position: "absolute",
          top: -160,
          right: -120,
          width: 520,
          height: 520,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(230,0,122,0.35), transparent 62%)",
          filter: "blur(8px)",
          pointerEvents: "none",
        }}
      />

      <Container sx={{ position: "relative" }}>
        <Box
          sx={{
            display: "grid",
            gap: { xs: 4, md: 6 },
            gridTemplateColumns: { xs: "1fr", md: "1.05fr 0.95fr" },
            alignItems: "center",
          }}
        >
          {/* Copy */}
          <Box sx={{ order: { xs: 2, md: 1 } }}>
            <Chip
              label="Rent a Car · Santo Domingo"
              size="small"
              sx={{ bgcolor: "rgba(255,255,255,0.12)", color: "common.white", mb: 3 }}
            />
            <Typography
              variant="h1"
              sx={{ fontSize: { xs: "2.5rem", sm: "3.25rem", md: "3.9rem" }, mb: 2 }}
            >
              Tu próximo viaje
              <Box component="span" sx={{ color: "primary.light", display: "block" }}>
                empieza sobre ruedas
              </Box>
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 400, color: "grey.300", maxWidth: 520, mb: 3 }}>
              Vehículos confiables con entrega en el Aeropuerto Las Américas (SDQ) y en Santo
              Domingo. Reserva simple y directa por WhatsApp.
            </Typography>

            <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1, mb: 4 }}>
              {TRUST.map((t) => (
                <Chip
                  key={t.label}
                  icon={t.icon as React.ReactElement}
                  label={t.label}
                  variant="outlined"
                  sx={{
                    color: "common.white",
                    borderColor: "rgba(255,255,255,0.28)",
                    "& .MuiChip-icon": { color: "primary.light" },
                  }}
                />
              ))}
            </Stack>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
              <WhatsAppButton
                phoneNumber={whatsappNumber}
                message={heroMessage}
                source="hero"
                size="large"
              />
              <Button
                href="/vehicles"
                variant="outlined"
                size="large"
                sx={{
                  color: "common.white",
                  borderColor: "rgba(255,255,255,0.5)",
                  "&:hover": { borderColor: "common.white", bgcolor: "rgba(255,255,255,0.08)" },
                }}
              >
                Ver la flota
              </Button>
            </Stack>
          </Box>

          {/* Image */}
          <Box sx={{ order: { xs: 1, md: 2 }, position: "relative" }}>
            <Box
              sx={{
                borderRadius: 6,
                overflow: "hidden",
                aspectRatio: { xs: "16 / 10", md: "4 / 3" },
                boxShadow: "0 30px 80px rgba(0,0,0,0.5)",
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={HERO_IMAGE}
                alt="Vehículo de alquiler listo para la carretera"
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            </Box>
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
