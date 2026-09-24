import * as React from "react";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import Typography from "@mui/material/Typography";
import ExpandMoreRoundedIcon from "@mui/icons-material/ExpandMoreRounded";
import SectionTitle from "@/components/ui/SectionTitle";
import { getFaqs } from "@/features/content/data";
import { getI18n } from "@/i18n/server";

/**
 * Preguntas frecuentes. Renders only when FAQs exist (owner-written, shown
 * as-is — not auto-translated). Uncontrolled accordions, so this stays a
 * Server Component.
 */
export default async function FaqSection() {
  const [faqs, { t }] = await Promise.all([getFaqs(), getI18n()]);
  if (faqs.length === 0) return null;

  return (
    <Box id="faq" sx={{ py: { xs: 6, md: 9 }, bgcolor: "grey.50" }}>
      <Container maxWidth="md">
        <SectionTitle title={t("faq.title")} align="center" />
        <Box sx={{ mt: 4 }}>
          {faqs.map((f) => (
            <Accordion
              key={f.id}
              disableGutters
              elevation={0}
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2,
                mb: 1.5,
                "&:before": { display: "none" },
              }}
            >
              <AccordionSummary expandIcon={<ExpandMoreRoundedIcon />}>
                <Typography sx={{ fontWeight: 600 }}>{f.question}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "pre-line" }}>
                  {f.answer}
                </Typography>
              </AccordionDetails>
            </Accordion>
          ))}
        </Box>
      </Container>
    </Box>
  );
}
