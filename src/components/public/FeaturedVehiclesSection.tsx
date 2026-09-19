import * as React from "react";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import VehiclesCarousel from "@/components/public/VehiclesCarousel";
import { getVehicles } from "@/features/vehicles/data";
import { getCompanySettings } from "@/lib/branding";

/**
 * Featured vehicles. Editorial header row (title left, "ver todos" right on
 * desktop). The whole fleet is shown as an auto-scrolling infinite carousel.
 * Renders nothing if there are no published vehicles.
 */
export default async function FeaturedVehiclesSection() {
  const [vehicles, { whatsappNumber }] = await Promise.all([
    getVehicles(),
    getCompanySettings(),
  ]);

  if (vehicles.length === 0) return null;

  return (
    <Box sx={{ py: { xs: 7, md: 11 }, bgcolor: "grey.50" }}>
      <Container>
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            justifyContent: "space-between",
            alignItems: { sm: "flex-end" },
            gap: 2,
            mb: { xs: 4, md: 5 },
          }}
        >
          <Box>
            <Typography variant="h3" component="h2" sx={{ mb: 1 }}>
              Elige tu próximo viaje
            </Typography>
            <Typography variant="subtitle1" color="text.secondary">
              Una selección de nuestros vehículos más solicitados.
            </Typography>
          </Box>
          <Button
            href="/vehicles"
            variant="text"
            endIcon={<ArrowForwardRoundedIcon />}
            sx={{ alignSelf: { xs: "flex-start", sm: "flex-end" } }}
          >
            Ver toda la flota
          </Button>
        </Box>

        <VehiclesCarousel vehicles={vehicles} whatsappNumber={whatsappNumber} />
      </Container>
    </Box>
  );
}
