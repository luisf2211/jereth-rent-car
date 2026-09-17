import * as React from "react";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import InstagramIcon from "@mui/icons-material/Instagram";
import FacebookIcon from "@mui/icons-material/Facebook";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import Logo from "@/components/ui/Logo";
import { getCompanySettings } from "@/lib/branding";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { PUBLIC_NAV_LINKS } from "./nav-links";

/**
 * Public footer with logo, links, contact and social media.
 * Rendered on a dark surface for contrast. Server Component.
 */
export default function PublicFooter() {
  const { companyName, whatsappNumber, contactEmail, socialLinks } = getCompanySettings();
  const whatsappUrl = buildWhatsAppUrl(whatsappNumber, "Hola, quiero información sobre alquiler de vehículos.");
  const year = new Date().getFullYear();

  return (
    <Box component="footer" sx={{ bgcolor: "secondary.main", color: "common.white", mt: 8 }}>
      <Container sx={{ py: { xs: 5, md: 7 } }}>
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 5 }}>
            <Logo variant="onDark" />
            <Typography variant="body2" sx={{ mt: 2, color: "grey.400", maxWidth: 360 }}>
              Renta el vehículo perfecto para tu próximo viaje. Atención rápida y cercana por WhatsApp.
            </Typography>
          </Grid>

          <Grid size={{ xs: 6, md: 3 }}>
            <Typography variant="subtitle2" sx={{ color: "common.white", mb: 1.5 }}>
              Navegación
            </Typography>
            <Stack spacing={1}>
              {PUBLIC_NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  variant="body2"
                  underline="hover"
                  sx={{ color: "grey.400", "&:hover": { color: "common.white" } }}
                >
                  {link.label}
                </Link>
              ))}
            </Stack>
          </Grid>

          <Grid size={{ xs: 6, md: 4 }} id="contacto">
            <Typography variant="subtitle2" sx={{ color: "common.white", mb: 1.5 }}>
              Contacto
            </Typography>
            <Stack spacing={1.5}>
              <Box
                component="a"
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ display: "flex", alignItems: "center", gap: 1, color: "grey.400", "&:hover": { color: "common.white" } }}
              >
                <WhatsAppIcon fontSize="small" />
                <Typography variant="body2">WhatsApp</Typography>
              </Box>
              <Box
                component="a"
                href={`mailto:${contactEmail}`}
                sx={{ display: "flex", alignItems: "center", gap: 1, color: "grey.400", "&:hover": { color: "common.white" } }}
              >
                <EmailRoundedIcon fontSize="small" />
                <Typography variant="body2">{contactEmail}</Typography>
              </Box>
              <Stack direction="row" spacing={1}>
                {socialLinks.instagram && (
                  <IconButton
                    component="a"
                    href={socialLinks.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Instagram"
                    sx={{ color: "grey.400", "&:hover": { color: "common.white" } }}
                  >
                    <InstagramIcon />
                  </IconButton>
                )}
                {socialLinks.facebook && (
                  <IconButton
                    component="a"
                    href={socialLinks.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Facebook"
                    sx={{ color: "grey.400", "&:hover": { color: "common.white" } }}
                  >
                    <FacebookIcon />
                  </IconButton>
                )}
              </Stack>
            </Stack>
          </Grid>
        </Grid>

        <Divider sx={{ my: 4, borderColor: "grey.800" }} />
        <Typography variant="body2" sx={{ color: "grey.500" }}>
          © {year} {companyName}. Todos los derechos reservados.
        </Typography>
      </Container>
    </Box>
  );
}
