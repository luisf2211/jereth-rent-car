import * as React from "react";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import SectionTitle from "@/components/ui/SectionTitle";
import WhatsAppButton from "@/components/ui/WhatsAppButton";
import DeliveryLocationsCarousel from "./DeliveryLocationsCarousel";
import { getDeliveryLocations } from "@/features/delivery-locations/data";
import { getCompanySettings } from "@/lib/branding";
import { getI18n } from "@/i18n/server";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";

/**
 * Lugares de entrega. Shows a photo carousel of the real pickup/delivery
 * locations (e.g. SDQ airport). Renders only when locations exist. Includes a
 * WhatsApp CTA and a link to the full /lugares-de-entrega page.
 *
 * NOTE: we use a plain <a> for the "Ver todos" link instead of MUI Button with
 * component={NextLink}, because passing a function (NextLink) from a Server
 * Component to a Client Component (MUI Button) violates RSC serialisation rules.
 */
export default async function DeliveryLocationsSection() {
  const [locations, { whatsappNumber }, { t }] = await Promise.all([
    getDeliveryLocations(),
    getCompanySettings(),
    getI18n(),
  ]);
  if (locations.length === 0) return null;

  const message = t("delivery.coordinateInquiry");

  return (
    <Box id="entrega" sx={{ py: { xs: 6, md: 9 }, bgcolor: "grey.50" }}>
      <Container>
        {/* Header row: title + "Ver todos" link */}
        <Box
          sx={{
            display: "flex",
            alignItems: { xs: "flex-start", sm: "flex-end" },
            flexDirection: { xs: "column", sm: "row" },
            gap: 2,
            mb: { xs: 3, md: 4 },
          }}
        >
          <Box sx={{ flexGrow: 1 }}>
            <SectionTitle
              title={t("delivery.sectionTitle")}
              subtitle={t("delivery.sectionSubtitle")}
              align="left"
            />
          </Box>

          {/*
           * Plain anchor styled to look like an outlined button.
           * Avoids passing a function (NextLink) across the Server→Client boundary.
           */}
          <Box
            component="a"
            href="/lugares-de-entrega"
            sx={{
              flexShrink: 0,
              whiteSpace: "nowrap",
              display: "inline-flex",
              alignItems: "center",
              gap: 0.75,
              px: 2,
              py: 0.875,
              borderRadius: 1,
              border: "1px solid",
              borderColor: "divider",
              color: "text.primary",
              fontSize: "0.9375rem",
              fontWeight: 500,
              textDecoration: "none",
              lineHeight: 1.75,
              transition: "border-color 0.15s, background-color 0.15s",
              "&:hover": {
                borderColor: "text.primary",
                bgcolor: "action.hover",
              },
            }}
          >
            {t("delivery.seeAll")}
            <ArrowForwardRoundedIcon sx={{ fontSize: 18 }} />
          </Box>
        </Box>

        <DeliveryLocationsCarousel locations={locations} />

        <Box sx={{ mt: 4, textAlign: "center" }}>
          <WhatsAppButton
            phoneNumber={whatsappNumber}
            message={message}
            label={t("delivery.coordinateWhatsapp")}
            source="delivery"
            size="large"
          />
        </Box>
      </Container>
    </Box>
  );
}
