import type { Metadata } from "next";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import SectionTitle from "@/components/ui/SectionTitle";
import EmptyState from "@/components/ui/EmptyState";
import VehiclesCatalog from "@/components/public/VehiclesCatalog";
import { getVehicles } from "@/features/vehicles/data";
import { getCompanySettings } from "@/lib/branding";
import { getReservationSettings } from "@/features/reservations/data";
import { getI18n } from "@/i18n/server";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: t("catalog.metaTitle"),
    description: t("catalog.metaDescription"),
  };
}

export default async function VehiclesPage() {
  const [vehicles, { whatsappNumber }, reservationSettings, { t }] = await Promise.all([
    getVehicles(),
    getCompanySettings(),
    getReservationSettings(),
    getI18n(),
  ]);

  return (
    <Container sx={{ pt: { xs: 12, md: 16 }, pb: { xs: 6, md: 8 } }}>
      <SectionTitle
        title={t("catalog.title")}
        subtitle={t("catalog.subtitle")}
      />

      <Box sx={{ mt: 4 }}>
        {vehicles.length === 0 ? (
          <EmptyState
            title={t("catalog.noVehiclesTitle")}
            description={t("catalog.noVehiclesDescription")}
          />
        ) : (
          <VehiclesCatalog vehicles={vehicles} whatsappNumber={whatsappNumber} digitalEnabled={reservationSettings.digitalEnabled} />
        )}
      </Box>
    </Container>
  );
}
