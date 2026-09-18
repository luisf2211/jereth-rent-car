import * as React from "react";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import VehicleCard from "@/components/public/VehicleCard";
import { getFeaturedVehicles } from "@/features/vehicles/data";
import { getCompanySettings } from "@/lib/branding";

/**
 * Featured vehicles. Editorial header row (title left, "ver todos" right on
 * desktop). Renders nothing if there are no published vehicles.
 * Responsive grid: 4 cols (md), 2 (sm), 1 (xs).
 */
export default async function FeaturedVehiclesSection() {
  const [vehicles, { whatsappNumber }] = await Promise.all([
    getFeaturedVehicles(4),
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

        <Grid container spacing={{ xs: 2.5, md: 3 }} sx={{ alignItems: "stretch" }}>
          {vehicles.map((vehicle) => (
            <Grid key={vehicle.id} size={{ xs: 12, sm: 6, md: 3 }} sx={{ display: "flex" }}>
              <VehicleCard vehicle={vehicle} whatsappNumber={whatsappNumber} />
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
