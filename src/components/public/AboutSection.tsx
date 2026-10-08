import * as React from "react";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import SectionTitle from "@/components/ui/SectionTitle";
import { getCompanySettings } from "@/lib/branding";
import { getI18n } from "@/i18n/server";
import { pickText } from "@/i18n/localize-content";

/**
 * Nosotros. Renders only when the owner has written an about text from the
 * backoffice. The section title follows the active locale; the about TEXT is
 * shown from its stored English column (aboutTextEn) when the EN locale is
 * active, with a safe fallback to the Spanish source.
 */
export default async function AboutSection() {
  const [{ companyName, aboutText, aboutTextEn }, { t, locale }] = await Promise.all([
    getCompanySettings(),
    getI18n(),
  ]);
  if (!aboutText) return null;
  const aboutLocalized = pickText(locale, aboutText, aboutTextEn);

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
