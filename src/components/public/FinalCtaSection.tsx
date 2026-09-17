import * as React from "react";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import WhatsAppButton from "@/components/ui/WhatsAppButton";
import { getCompanySettings } from "@/lib/branding";

/**
 * Closing call-to-action band.
 */
export default function FinalCtaSection() {
  const { whatsappNumber } = getCompanySettings();
  const message = "Hola, quiero reservar un vehículo. ¿Me ayudan?";

  return (
    <Container sx={{ py: { xs: 6, md: 8 } }}>
      <Box
        sx={{
          bgcolor: "secondary.main",
          color: "common.white",
          borderRadius: 4,
          px: { xs: 3, md: 8 },
          py: { xs: 5, md: 7 },
          textAlign: "center",
        }}
      >
        <Typography variant="h4" component="h2" sx={{ mb: 1.5 }}>
          ¿Listo para tu próximo viaje?
        </Typography>
        <Typography variant="h6" component="p" sx={{ fontWeight: 400, color: "grey.300", mb: 4 }}>
          Escríbenos por WhatsApp y reserva tu vehículo en minutos.
        </Typography>
        <WhatsAppButton phoneNumber={whatsappNumber} message={message} size="large" />
      </Box>
    </Container>
  );
}
