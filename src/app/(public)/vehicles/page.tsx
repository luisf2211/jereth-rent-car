import type { Metadata } from "next";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import SectionTitle from "@/components/ui/SectionTitle";
import EmptyState from "@/components/ui/EmptyState";
import VehicleCard from "@/components/public/VehicleCard";
import { getVehicles } from "@/features/vehicles/mock";

export const metadata: Metadata = {
  title: "Vehículos",
  description: "Explora nuestra flota de vehículos disponibles para renta.",
};

export default function VehiclesPage() {
  const vehicles = getVehicles();

  return (
    <Container sx={{ py: { xs: 5, md: 7 } }}>
      <SectionTitle
        title="Nuestros vehículos"
        subtitle="Elige el vehículo ideal para tu viaje y resérvalo por WhatsApp."
      />
      <Box sx={{ mt: 4 }}>
        {vehicles.length === 0 ? (
          <EmptyState
            title="No hay vehículos disponibles"
            description="Vuelve pronto o escríbenos por WhatsApp para más opciones."
          />
        ) : (
          <Grid container spacing={{ xs: 2.5, md: 3 }}>
            {vehicles.map((vehicle) => (
              <Grid key={vehicle.id} size={{ xs: 12, sm: 6, md: 4 }}>
                <VehicleCard vehicle={vehicle} />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Container>
  );
}
