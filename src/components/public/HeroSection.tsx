import * as React from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import { getCompanySettings } from "@/lib/branding";
import { getVehicles } from "@/features/vehicles/data";
import HeroCarousel from "./HeroCarousel";

/**
 * Hero: a short, confident headline on the left and a vehicle carousel on the
 * right (Turo-style). Selecting a vehicle opens a WhatsApp quote. Light,
 * editorial layout — no repeated CTAs, no decorative glow.
 */
export default async function HeroSection() {
  const [{ whatsappNumber }, vehicles] = await Promise.all([
    getCompanySettings(),
    getVehicles(),
  ]);

  return (
    <Box component="section" sx={{ pt: { xs: 12, md: 16 }, pb: { xs: 6, md: 10 } }}>
      <Container>
        <Box
          sx={{
            display: "grid",
            gap: { xs: 4, md: 6 },
            gridTemplateColumns: { xs: "1fr", md: "0.9fr 1.1fr" },
            alignItems: "center",
          }}
        >
          <Box>
            <Typography
              variant="h1"
              sx={{ fontSize: { xs: "2.4rem", sm: "3rem", md: "3.6rem" }, mb: 2.5 }}
            >
              Renta tu vehículo en Santo Domingo
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 400, color: "text.secondary", maxWidth: 460, lineHeight: 1.6 }}>
              Entrega en el Aeropuerto Las Américas (SDQ) y en toda la ciudad.
              Elige tu vehículo y cotiza al instante por WhatsApp.
            </Typography>
          </Box>

          <HeroCarousel vehicles={vehicles} whatsappNumber={whatsappNumber} />
        </Box>
      </Container>
    </Box>
  );
}
