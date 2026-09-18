import * as React from "react";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import ChatRoundedIcon from "@mui/icons-material/ChatRounded";
import DirectionsCarFilledRoundedIcon from "@mui/icons-material/DirectionsCarFilledRounded";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import LuggageRoundedIcon from "@mui/icons-material/LuggageRounded";
import SectionTitle from "@/components/ui/SectionTitle";

const STEPS = [
  {
    icon: ChatRoundedIcon,
    title: "Escríbenos",
    description: "Contáctanos por WhatsApp y cuéntanos qué necesitas.",
  },
  {
    icon: DirectionsCarFilledRoundedIcon,
    title: "Elige tu vehículo",
    description: "Te ayudamos a elegir el vehículo ideal para tu viaje.",
  },
  {
    icon: EventAvailableRoundedIcon,
    title: "Confirma tu reserva",
    description: "Acordamos fechas, entrega y condiciones de forma simple.",
  },
  {
    icon: LuggageRoundedIcon,
    title: "Disfruta tu viaje",
    description: "Recibe tu vehículo y disfruta la carretera con tranquilidad.",
  },
];

/**
 * "How it works" — four ordered steps shown as icon badges connected by a
 * subtle guide line on desktop, so the flow reads left-to-right.
 */
export default function HowItWorksSection() {
  return (
    <Box id="como-funciona" sx={{ py: { xs: 6, md: 9 }, bgcolor: "grey.50" }}>
      <Container>
        <SectionTitle
          title="Cómo funciona"
          subtitle="Rentar con nosotros es simple. En cuatro pasos estás en camino."
          align="center"
        />

        <Box sx={{ position: "relative", mt: { xs: 4, md: 6 } }}>
          {/* Connecting guide line (desktop only), sits behind the badges. */}
          <Box
            aria-hidden
            sx={{
              display: { xs: "none", md: "block" },
              position: "absolute",
              top: 32,
              left: "12.5%",
              right: "12.5%",
              height: "2px",
              bgcolor: "divider",
            }}
          />

          <Grid container spacing={{ xs: 4, md: 3 }}>
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              return (
                <Grid key={step.title} size={{ xs: 12, sm: 6, md: 3 }}>
                  <Box
                    sx={{
                      position: "relative",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      textAlign: "center",
                      px: 1,
                    }}
                  >
                    {/* Icon badge */}
                    <Box
                      sx={{
                        position: "relative",
                        width: 64,
                        height: 64,
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        bgcolor: "common.white",
                        color: "primary.main",
                        border: "2px solid",
                        borderColor: "primary.main",
                        boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
                      }}
                    >
                      <Icon sx={{ fontSize: 30 }} />
                      {/* Step number chip */}
                      <Box
                        sx={{
                          position: "absolute",
                          top: -6,
                          right: -6,
                          width: 24,
                          height: 24,
                          borderRadius: "50%",
                          bgcolor: "primary.main",
                          color: "primary.contrastText",
                          fontSize: "0.8rem",
                          fontWeight: 700,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {index + 1}
                      </Box>
                    </Box>

                    <Typography variant="h6" component="h3" sx={{ mt: 2.5, mb: 0.75 }}>
                      {step.title}
                    </Typography>
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ lineHeight: 1.6, maxWidth: 240 }}
                    >
                      {step.description}
                    </Typography>
                  </Box>
                </Grid>
              );
            })}
          </Grid>
        </Box>
      </Container>
    </Box>
  );
}
