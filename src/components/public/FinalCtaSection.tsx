import * as React from "react";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import WhatsAppButton from "@/components/ui/WhatsAppButton";
import { getCompanySettings } from "@/lib/branding";

/**
 * Closing call-to-action band.
 */
export default async function FinalCtaSection() {
  const { whatsappNumber } = await getCompanySettings();
  const message = "Hola Jereth Rent Car, quiero reservar un vehículo. ¿Me ayudan?";

  return (
    <Container sx={{ py: { xs: 7, md: 10 } }}>
      <Box
        sx={{
          position: "relative",
          overflow: "hidden",
          bgcolor: "#0A0A0A",
          color: "common.white",
          borderRadius: 6,
          px: { xs: 3, md: 8 },
          py: { xs: 6, md: 9 },
          textAlign: "center",
        }}
      >
        <Box
          aria-hidden
          sx={{
            position: "absolute",
            bottom: -140,
            left: "50%",
            transform: "translateX(-50%)",
            width: 620,
            height: 400,
            background: "radial-gradient(circle, rgba(230,0,122,0.4), transparent 60%)",
            pointerEvents: "none",
          }}
        />
        <Box sx={{ position: "relative" }}>
          <Typography variant="h3" component="h2" sx={{ mb: 1.5 }}>
            ¿Listo para tu próximo viaje?
          </Typography>
          <Typography variant="h6" component="p" sx={{ fontWeight: 400, color: "grey.400", mb: 4, maxWidth: 560, mx: "auto" }}>
            Escríbenos por WhatsApp y coordina tu vehículo en minutos.
          </Typography>
          <WhatsAppButton phoneNumber={whatsappNumber} message={message} source="final_cta" size="large" />
        </Box>
      </Box>
    </Container>
  );
}
