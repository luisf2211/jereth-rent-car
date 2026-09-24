import * as React from "react";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import PhoneRoundedIcon from "@mui/icons-material/PhoneRounded";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import InstagramIcon from "@mui/icons-material/Instagram";
import FacebookIcon from "@mui/icons-material/Facebook";
import PlaceRoundedIcon from "@mui/icons-material/PlaceRounded";
import SectionTitle from "@/components/ui/SectionTitle";
import { getCompanySettings } from "@/lib/branding";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { getI18n } from "@/i18n/server";

/**
 * Contacto. Each channel renders only if configured (no invented data).
 */
export default async function ContactSection() {
  const [s, { t }] = await Promise.all([getCompanySettings(), getI18n()]);

  const channels: { icon: React.ReactNode; label: string; href: string; source?: string }[] = [];
  if (s.whatsappNumber) {
    channels.push({
      icon: <WhatsAppIcon />,
      label: "WhatsApp",
      href: buildWhatsAppUrl(s.whatsappNumber, t("contact.inquiry")),
      source: "contact",
    });
  }
  if (s.phone) channels.push({ icon: <PhoneRoundedIcon />, label: s.phone, href: `tel:${s.phone.replace(/\s/g, "")}` });
  if (s.contactEmail) channels.push({ icon: <EmailRoundedIcon />, label: s.contactEmail, href: `mailto:${s.contactEmail}` });
  if (s.socialLinks.instagram) channels.push({ icon: <InstagramIcon />, label: "Instagram", href: s.socialLinks.instagram });
  if (s.socialLinks.facebook) channels.push({ icon: <FacebookIcon />, label: "Facebook", href: s.socialLinks.facebook });

  // Nothing to show if no contact channels are configured.
  if (channels.length === 0 && !s.googleMapsUrl && !s.address) return null;

  return (
    <Box id="contacto" sx={{ py: { xs: 6, md: 9 } }}>
      <Container>
        <SectionTitle title={t("contact.title")} subtitle={t("contact.subtitle")} align="center" />

        <Grid container spacing={2} sx={{ mt: 2, justifyContent: "center" }}>
          {channels.map((c) => (
            <Grid key={c.label} size={{ xs: 12, sm: "auto" }}>
              <Button
                component="a"
                href={c.href}
                target={c.href.startsWith("http") ? "_blank" : undefined}
                rel={c.href.startsWith("http") ? "noopener noreferrer" : undefined}
                variant="outlined"
                color="secondary"
                startIcon={c.icon}
                fullWidth
                data-wa-source={c.source}
              >
                {c.label}
              </Button>
            </Grid>
          ))}
        </Grid>

        {s.address && (
          <Box sx={{ mt: 4, display: "flex", alignItems: "center", justifyContent: "center", gap: 1, color: "text.secondary" }}>
            <PlaceRoundedIcon fontSize="small" />
            <Typography variant="body2">{s.address}</Typography>
          </Box>
        )}

        {s.googleMapsUrl && (
          <Box sx={{ mt: 3, textAlign: "center" }}>
            <Button
              component="a"
              href={s.googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              variant="text"
              startIcon={<PlaceRoundedIcon />}
            >
              {t("contact.viewOnMaps")}
            </Button>
          </Box>
        )}
      </Container>
    </Box>
  );
}
