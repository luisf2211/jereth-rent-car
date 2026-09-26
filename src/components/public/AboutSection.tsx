import * as React from "react";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import SectionTitle from "@/components/ui/SectionTitle";
import { getCompanySettings } from "@/lib/branding";
import { getI18n } from "@/i18n/server";
import { localizeAbout } from "@/i18n/content-overrides";

/**
 * Nosotros. Renders only when the owner has written an about text from the
 * backoffice. The section title follows the active locale; the about TEXT is
 * shown in the active language when it matches the known demo content
 * (localizeAbout), otherwise as typed by the owner.
 */
export default async function AboutSection() {
  const [{ companyName, aboutText }, { t, locale }] = await Promise.all([
    getCompanySettings(),
    getI18n(),
  ]);
  if (!aboutText) return null;
  const aboutLocalized = localizeAbout(locale, aboutText);

  return (
    <Box id="nosotros" sx={{ py: { xs: 6, md: 9 } }}>
      <Container maxWidth="md">
        <SectionTitle title={t("about.title", { company: companyName })} align="center" />
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ mt: 3, textAlign: "center", whiteSpace: "pre-line", maxWidth: 720, mx: "auto" }}
        >
          {aboutLocalized}
        </Typography>
      </Container>
    </Box>
  );
}
