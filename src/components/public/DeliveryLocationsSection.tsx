import * as React from "react";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import NextLink from "next/link";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import SectionTitle from "@/components/ui/SectionTitle";
import WhatsAppButton from "@/components/ui/WhatsAppButton";
import DeliveryLocationsCarousel from "./DeliveryLocationsCarousel";
import { getDeliveryLocations } from "@/features/delivery-locations/data";
import { getCompanySettings } from "@/lib/branding";

/**
 * Lugares de entrega. Shows a photo carousel of the real pickup/delivery
 * locations (e.g. SDQ airport). Renders only when locations exist. Includes a
 * WhatsApp CTA and a link to the full /lugares-de-entrega page.
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
        {/* Header row: title + "Ver todos" link */}
        <Box
          sx={{
            display: "flex",
            alignItems: { xs: "flex-start", sm: "flex-end" },
            flexDirection: { xs: "column", sm: "row" },
            gap: 2,
            mb: { xs: 3, md: 4 },
          }}
        >
          <Box sx={{ flexGrow: 1 }}>
            <SectionTitle
              title="Lugares de entrega"
              subtitle="Coordinamos la entrega y recogida de tu vehículo en los puntos que más te convienen."
              align="left"
            />
          </Box>
          <Button
            component={NextLink}
            href="/lugares-de-entrega"
            variant="outlined"
            color="secondary"
            endIcon={<ArrowForwardRoundedIcon />}
            sx={{ flexShrink: 0, whiteSpace: "nowrap" }}
          >
            Ver todos los lugares
          </Button>
        </Box>

        <DeliveryLocationsCarousel locations={locations} />

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
