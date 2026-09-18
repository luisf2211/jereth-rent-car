import * as React from "react";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import FlightLandRoundedIcon from "@mui/icons-material/FlightLandRounded";
import PlaceRoundedIcon from "@mui/icons-material/PlaceRounded";
import SectionTitle from "@/components/ui/SectionTitle";
import WhatsAppButton from "@/components/ui/WhatsAppButton";
import { getDeliveryLocations } from "@/features/delivery-locations/data";
import { getCompanySettings } from "@/lib/branding";

/**
 * Lugares de entrega. Renders only when locations exist. Highlighted ones
 * (e.g. SDQ airport) show a badge. Includes a WhatsApp CTA to coordinate.
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
          subtitle="Coordinamos la entrega y recogida de tu vehículo."
        />
        <Grid container spacing={{ xs: 2.5, md: 3 }} sx={{ mt: 1 }}>
          {locations.map((loc) => (
            <Grid key={loc.id} size={{ xs: 12, md: 6 }}>
              <Card sx={{ height: "100%" }}>
                <CardContent>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 1 }}>
                    {loc.highlighted ? (
                      <FlightLandRoundedIcon sx={{ color: "primary.main" }} />
                    ) : (
                      <PlaceRoundedIcon sx={{ color: "primary.main" }} />
                    )}
                    <Typography variant="h6" component="h3">
                      {loc.name}
                    </Typography>
                    {loc.highlighted && <Chip label="Destacado" size="small" color="primary" />}
                  </Box>
                  {loc.description && (
                    <Typography variant="body2" color="text.secondary">
                      {loc.description}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
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
