import * as React from "react";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import SectionTitle from "@/components/ui/SectionTitle";
import { getRequirements } from "@/features/content/data";
import { getI18n } from "@/i18n/server";
import { localizeRequirement } from "@/i18n/content-overrides";

/**
 * Requisitos para rentar. Renders only if the owner added requirements from
 * the backoffice. Titles follow the active locale; each requirement text is
 * shown in the active language when it matches known demo content
 * (localizeRequirement), otherwise as typed.
 */
export default async function RequirementsSection() {
  const [requirements, { t, locale }] = await Promise.all([getRequirements(), getI18n()]);
  if (requirements.length === 0) return null;

  return (
    <Box id="requisitos" sx={{ py: { xs: 6, md: 9 } }}>
      <Container>
        <SectionTitle
          title={t("requirements.title")}
          subtitle={t("requirements.subtitle")}
        />
        <Grid container spacing={{ xs: 2, md: 3 }} sx={{ mt: 1 }}>
          {requirements.map((r) => (
            <Grid key={r.id} size={{ xs: 12, sm: 6 }}>
              <Box sx={{ display: "flex", gap: 1.5, alignItems: "flex-start" }}>
                <CheckCircleRoundedIcon sx={{ color: "primary.main", mt: 0.2 }} />
                <Typography variant="body1">{localizeRequirement(locale, r.text)}</Typography>
              </Box>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
