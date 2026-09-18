import * as React from "react";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import SectionTitle from "@/components/ui/SectionTitle";
import { getRequirements } from "@/features/content/data";

/**
 * Requisitos para rentar. Renders only if the owner added requirements from
 * the backoffice — we never show invented policies.
 */
export default async function RequirementsSection() {
  const requirements = await getRequirements();
  if (requirements.length === 0) return null;

  return (
    <Box id="requisitos" sx={{ py: { xs: 6, md: 9 } }}>
      <Container>
        <SectionTitle
          title="Requisitos para rentar"
          subtitle="Lo que necesitas para llevarte tu vehículo."
        />
        <Grid container spacing={{ xs: 2, md: 3 }} sx={{ mt: 1 }}>
          {requirements.map((r) => (
            <Grid key={r.id} size={{ xs: 12, sm: 6 }}>
              <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
                <CheckCircleRoundedIcon sx={{ color: "primary.main", mt: 0.2 }} />
                <Typography variant="body1">{r.text}</Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
