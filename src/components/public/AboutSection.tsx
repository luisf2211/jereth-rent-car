import * as React from "react";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import SectionTitle from "@/components/ui/SectionTitle";
import { getCompanySettings } from "@/lib/branding";

/**
 * Nosotros. Renders only when the owner has written an about text from the
 * backoffice. No corporate filler.
 */
export default async function AboutSection() {
  const { companyName, aboutText } = await getCompanySettings();
  if (!aboutText) return null;

  return (
    <Box id="nosotros" sx={{ py: { xs: 6, md: 9 } }}>
      <Container maxWidth="md">
        <SectionTitle title={`Sobre ${companyName}`} align="center" />
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ mt: 3, textAlign: "center", whiteSpace: "pre-line", maxWidth: 720, mx: "auto" }}
        >
          {aboutText}
        </Typography>
      </Container>
    </Box>
  );
}
