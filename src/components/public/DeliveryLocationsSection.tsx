import * as React from "react";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import SectionTitle from "@/components/ui/SectionTitle";
import WhatsAppButton from "@/components/ui/WhatsAppButton";
import DeliveryLocationsCarousel from "./DeliveryLocationsCarousel";
import { getDeliveryLocations } from "@/features/delivery-locations/data";
import { getCompanySettings } from "@/lib/branding";

/**
 * Lugares de entrega. Shows a photo carousel of the real pickup/delivery
 * locations (e.g. SDQ airport). Renders only when locations exist. Includes a
 * WhatsApp CTA to coordinate.
 */
export default async function DeliveryLocationsSection() {
  const [locations, { whatsappNumber }] = await Promise.all([
    getDeliveryLocations(),
    getCompanySettings(),
  ]);
  if (locations.length === 0) return null;

  const message = "Hola Jereth Rent Car, quisiera coordinar la entrega de un vehículo.";

  return (
    <Box id="entrega" sx={{ py: { xs: 6, md: 9 }, bgcolor: "grey.50" }}>
      <Container>
        <SectionTitle
          title="Lugares de entrega"
          subtitle="Coordinamos la entrega y recogida de tu vehículo en los puntos que más te convienen."
          align="center"
        />
        <Box sx={{ mt: { xs: 3, md: 4 } }}>
          <DeliveryLocationsCarousel locations={locations} />
        </Box>
        <Box sx={{ mt: 4, textAlign: "center" }}>
          <WhatsAppButton
            phoneNumber={whatsappNumber}
            message={message}
            label="Coordinar entrega por WhatsApp"
            source="delivery"
            size="large"
          />
        </Box>
      </Container>
    </Box>
  );
}
