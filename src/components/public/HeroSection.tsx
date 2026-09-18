import * as React from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import { getCompanySettings } from "@/lib/branding";
import { getVehicles } from "@/features/vehicles/data";
import HeroCarousel from "./HeroCarousel";

const DEFAULT_TITLE = "Renta tu vehículo en Santo Domingo";
const DEFAULT_SUBTITLE =
  "Entrega en el Aeropuerto Las Américas (SDQ) y en toda la ciudad. Elige tu vehículo y cotiza al instante por WhatsApp.";

/**
 * Hero: a confident headline on the left and a vehicle carousel on the right
 * (Turo-style). The owner can set a background photo and the headline/subtitle
 * from the backoffice; sensible defaults are used when empty. When a photo is
 * set, the section renders on a dark, professional overlay for legibility.
 */
export default async function HeroSection() {
  const [settings, vehicles] = await Promise.all([getCompanySettings(), getVehicles()]);
  const { whatsappNumber, heroImageUrl, heroTitle, heroSubtitle } = settings;

  const title = heroTitle?.trim() || DEFAULT_TITLE;
  const subtitle = heroSubtitle?.trim() || DEFAULT_SUBTITLE;
  const hasImage = Boolean(heroImageUrl);

  return (
    <Box
      component="section"
      sx={{
        position: "relative",
        pt: { xs: 12, md: 16 },
        pb: { xs: 6, md: 10 },
        overflow: "hidden",
        // On a photo background we switch to light text for contrast.
        color: hasImage ? "common.white" : "text.primary",
      }}
    >
      {/* Background photo + gradient overlay (only when a photo is set) */}
      {hasImage && (
        <Box aria-hidden sx={{ position: "absolute", inset: 0, zIndex: 0 }}>
          <Box
            component="img"
            src={heroImageUrl!}
            alt=""
            sx={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, rgba(10,10,10,0.72) 0%, rgba(10,10,10,0.55) 45%, rgba(10,10,10,0.72) 100%)",
            }}
          />
        </Box>
      )}

      <Container sx={{ position: "relative", zIndex: 1 }}>
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
              {title}
            </Typography>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 400,
                color: hasImage ? "rgba(255,255,255,0.85)" : "text.secondary",
                maxWidth: 460,
                lineHeight: 1.6,
              }}
            >
              {subtitle}
            </Typography>
          </Box>

          <HeroCarousel vehicles={vehicles} whatsappNumber={whatsappNumber} />
        </Box>
      </Container>
    </Box>
  );
}
