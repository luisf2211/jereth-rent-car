import * as React from "react";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import SectionTitle from "@/components/ui/SectionTitle";

const STEPS = [
  { title: "Escríbenos", description: "Contáctanos por WhatsApp y cuéntanos qué necesitas." },
  { title: "Elige tu vehículo", description: "Te ayudamos a elegir el vehículo ideal para tu viaje." },
  { title: "Confirma tu reserva", description: "Acordamos fechas, entrega y condiciones de forma simple." },
  { title: "Disfruta tu viaje", description: "Recibe tu vehículo y disfruta la carretera con tranquilidad." },
];

/**
 * "How it works" — four numbered steps.
 */
export default function HowItWorksSection() {
  return (
    <Box id="como-funciona" sx={{ py: { xs: 6, md: 9 } }}>
      <Container>
        <SectionTitle
          title="Cómo funciona"
          subtitle="Rentar con nosotros es simple. En cuatro pasos estás en camino."
          align="center"
        />
        <Grid container spacing={{ xs: 4, md: 4 }} sx={{ mt: 1 }}>
          {STEPS.map((step, index) => (
            <Grid key={step.title} size={{ xs: 12, sm: 6, md: 3 }}>
              <Box sx={{ position: "relative" }}>
                <Typography
                  aria-hidden
                  sx={{
                    fontSize: "3.5rem",
                    fontWeight: 800,
                    lineHeight: 1,
                    color: "rgba(230,0,122,0.14)",
                    letterSpacing: "-0.04em",
                    mb: 1,
                  }}
                >
                  {String(index + 1).padStart(2, "0")}
                </Typography>
                <Typography variant="h6" component="h3" sx={{ mb: 0.75 }}>
                  {step.title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                  {step.description}
                </Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
