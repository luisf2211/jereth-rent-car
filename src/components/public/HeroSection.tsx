import * as React from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import WhatsAppButton from "@/components/ui/WhatsAppButton";
import { getCompanySettings } from "@/lib/branding";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1600&q=80";

/**
 * Landing hero: large photo, headline, secondary text and primary CTA.
 */
export default async function HeroSection() {
  const { whatsappNumber } = await getCompanySettings();
  const message = "Hola, quiero rentar un vehículo. ¿Me pueden ayudar?";

  return (
    <Box
      sx={{
        position: "relative",
        color: "common.white",
        minHeight: { xs: 520, md: 640 },
        display: "flex",
        alignItems: "center",
        backgroundImage: `linear-gradient(90deg, rgba(10,10,10,0.72) 0%, rgba(10,10,10,0.35) 60%, rgba(10,10,10,0.15) 100%), url(${HERO_IMAGE})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <Container>
        <Box sx={{ maxWidth: 620, py: { xs: 6, md: 0 } }}>
          <Typography variant="h2" component="h1" sx={{ fontSize: { xs: "2.25rem", md: "3.5rem" }, mb: 2 }}>
            Renta el vehículo perfecto para ti
          </Typography>
          <Typography variant="h6" component="p" sx={{ fontWeight: 400, color: "grey.200", mb: 4 }}>
            Reserva de forma simple y rápida. Vehículos confiables, precios claros y atención
            directa por WhatsApp.
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <WhatsAppButton phoneNumber={whatsappNumber} message={message} size="large" />
            <Button
              href="/vehicles"
              variant="outlined"
              size="large"
              sx={{
                color: "common.white",
                borderColor: "common.white",
                "&:hover": { borderColor: "common.white", bgcolor: "rgba(255,255,255,0.1)" },
              }}
            >
              Ver vehículos
            </Button>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}
