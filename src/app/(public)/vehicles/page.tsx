import type { Metadata } from "next";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import SectionTitle from "@/components/ui/SectionTitle";
import EmptyState from "@/components/ui/EmptyState";
import VehiclesCatalog from "@/components/public/VehiclesCatalog";
import { getVehicles } from "@/features/vehicles/data";
import { getCompanySettings } from "@/lib/branding";

export const metadata: Metadata = {
  title: "Vehículos",
  description: "Explora nuestra flota de vehículos para alquiler en Santo Domingo. Filtra por categoría, transmisión y pasajeros.",
};

export default async function VehiclesPage() {
  const [vehicles, { whatsappNumber }] = await Promise.all([
    getVehicles(),
    getCompanySettings(),
  ]);

  return (
    <Container sx={{ pt: { xs: 12, md: 16 }, pb: { xs: 6, md: 8 } }}>
      <SectionTitle
        title="Nuestra flota"
        subtitle="Filtra por categoría, transmisión o capacidad y consulta disponibilidad por WhatsApp."
      />

      <Box sx={{ mt: 4 }}>
        {vehicles.length === 0 ? (
          <EmptyState
            title="No hay vehículos disponibles"
            description="Vuelve pronto o escríbenos por WhatsApp para más opciones."
          />
        ) : (
          <VehiclesCatalog vehicles={vehicles} whatsappNumber={whatsappNumber} />
        )}
      </Box>
    </Container>
  );
}
