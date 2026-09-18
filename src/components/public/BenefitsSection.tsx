import * as React from "react";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import VerifiedUserRoundedIcon from "@mui/icons-material/VerifiedUserRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import SupportAgentRoundedIcon from "@mui/icons-material/SupportAgentRounded";

interface Benefit {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const BENEFITS: Benefit[] = [
  {
    icon: <VerifiedUserRoundedIcon />,
    title: "Seguridad y confianza",
    description: "Vehículos revisados y documentación en regla para tu tranquilidad.",
  },
  {
    icon: <PaymentsRoundedIcon />,
    title: "Precios competitivos",
    description: "Tarifas claras por día, sin cargos ocultos ni sorpresas.",
  },
  {
    icon: <BoltRoundedIcon />,
    title: "Entrega rápida y flexible",
    description: "Coordinamos la entrega según tu horario y ubicación.",
  },
  {
    icon: <SupportAgentRoundedIcon />,
    title: "Atención por WhatsApp",
    description: "Resolvemos tus dudas y reservas al instante, sin llamadas.",
  },
];

/**
 * Four key benefits. Clean icon-led layout, no heavy boxes — the icon sits in
 * a soft tinted square, text left-aligned for a calmer rhythm.
 */
export default function BenefitsSection() {
  return (
    <Box id="beneficios" sx={{ py: { xs: 7, md: 11 } }}>
      <Container>
        <Grid container spacing={{ xs: 4, md: 5 }}>
          {BENEFITS.map((benefit) => (
            <Grid key={benefit.title} size={{ xs: 12, sm: 6, md: 3 }}>
              <Box
                sx={{
                  display: "inline-flex",
                  p: 1.4,
                  borderRadius: 3,
                  bgcolor: "rgba(230,0,122,0.08)",
                  color: "primary.main",
                  mb: 2,
                }}
              >
                {benefit.icon}
              </Box>
              <Typography variant="h6" component="h3" sx={{ mb: 0.75 }}>
                {benefit.title}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6 }}>
                {benefit.description}
              </Typography>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
