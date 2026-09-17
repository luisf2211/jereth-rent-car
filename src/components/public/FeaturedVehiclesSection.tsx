import * as React from "react";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import SectionTitle from "@/components/ui/SectionTitle";
import VehicleCard from "@/components/public/VehicleCard";
import { getFeaturedVehicles } from "@/features/vehicles/data";
import { getCompanySettings } from "@/lib/branding";

/**
 * Featured vehicles grid.
 * Responsive: 4 columns (md), 2 (sm), 1 (xs).
 */
export default async function FeaturedVehiclesSection() {
  const [vehicles, { whatsappNumber }] = await Promise.all([
    getFeaturedVehicles(4),
    getCompanySettings(),
  ]);

  return (
    <Box sx={{ py: { xs: 6, md: 9 }, bgcolor: "grey.50" }}>
      <Container>
        <SectionTitle
          title="Elige tu próximo viaje"
          subtitle="Una selección de nuestros vehículos más solicitados."
          align="center"
        />
        <Grid container spacing={{ xs: 2.5, md: 3 }} sx={{ mt: 1 }}>
          {vehicles.map((vehicle) => (
            <Grid key={vehicle.id} size={{ xs: 12, sm: 6, md: 3 }}>
              <VehicleCard vehicle={vehicle} whatsappNumber={whatsappNumber} />
            </Grid>
          ))}
        </Grid>
        <Box sx={{ textAlign: "center", mt: 5 }}>
          <Button href="/vehicles" variant="outlined" color="secondary" size="large">
            Ver todos los vehículos
          </Button>
        </Box>
      </Container>
    </Box>
  );
}
