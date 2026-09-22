import * as React from "react";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import ChatRoundedIcon from "@mui/icons-material/ChatRounded";
import DirectionsCarFilledRoundedIcon from "@mui/icons-material/DirectionsCarFilledRounded";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import LuggageRoundedIcon from "@mui/icons-material/LuggageRounded";
import SectionTitle from "@/components/ui/SectionTitle";
import { getCompanySettings } from "@/lib/branding";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

/**
 * "How it works" — four ordered steps shown as icon badges connected by a
 * subtle guide line on desktop. Steps 1–3 are interactive:
 *   1 → WhatsApp (opens wa.me link)
 *   2 → /vehicles
 *   3 → /#reserva  (booking section on the detail page)
 *   4 → decorative only
 */
export default async function HowItWorksSection() {
  const { whatsappNumber } = await getCompanySettings();
  const waUrl = buildWhatsAppUrl(
    whatsappNumber,
    "Hola Jereth Rent Car, estoy interesado en rentar un vehículo."
  );

  const STEPS = [
    {
      icon: ChatRoundedIcon,
      title: "Escríbenos",
      description: "Contáctanos por WhatsApp y cuéntanos qué necesitas.",
      href: waUrl,
      external: true,
      ariaLabel: "Escríbenos por WhatsApp",
    },
    {
      icon: DirectionsCarFilledRoundedIcon,
      title: "Elige tu vehículo",
      description: "Te ayudamos a elegir el vehículo ideal para tu viaje.",
      href: "/vehicles",
      external: false,
      ariaLabel: "Ver todos los vehículos disponibles",
    },
    {
      icon: EventAvailableRoundedIcon,
      title: "Confirma tu reserva",
      description: "Acordamos fechas, entrega y condiciones de forma simple.",
      href: "/vehicles",
      external: false,
      ariaLabel: "Confirmar reserva — ver vehículos",
    },
    {
      icon: LuggageRoundedIcon,
      title: "Disfruta tu viaje",
      description: "Recibe tu vehículo y disfruta la carretera con tranquilidad.",
      href: null,
      external: false,
      ariaLabel: undefined,
    },
  ] as const;

  return (
    <Box id="como-funciona" sx={{ py: { xs: 6, md: 9 }, bgcolor: "grey.50" }}>
      <Container>
        <SectionTitle
          title="Cómo funciona"
          subtitle="Rentar con nosotros es simple. En cuatro pasos estás en camino."
          align="center"
        />

        <Box sx={{ position: "relative", mt: { xs: 4, md: 6 } }}>
          {/* Connecting guide line (desktop only) */}
          <Box
            aria-hidden
            sx={{
              display: { xs: "none", md: "block" },
              position: "absolute",
              top: 32,
              left: "12.5%",
              right: "12.5%",
              height: "2px",
              bgcolor: "divider",
            }}
          />

          <Grid container spacing={{ xs: 4, md: 3 }}>
            {STEPS.map((step, index) => {
              const Icon = step.icon;
              const isClickable = step.href !== null;

              const inner = (
                <Box
                  sx={{
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    textAlign: "center",
                    px: 1,
                    borderRadius: 3,
                    py: 1,
                    // Hover/focus styles only for clickable steps
                    ...(isClickable && {
                      cursor: "pointer",
                      transition: "background-color 0.18s ease, transform 0.18s ease",
                      "&:hover": {
                        bgcolor: "rgba(0,0,0,0.04)",
                        transform: "translateY(-2px)",
                        "& .step-badge": {
                          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                        },
                      },
                      "&:focus-visible": {
                        outline: "2px solid",
                        outlineColor: "primary.main",
                        outlineOffset: 2,
                      },
                    }),
                  }}
                >
                  {/* Icon badge */}
                  <Box
                    className="step-badge"
                    sx={{
                      position: "relative",
                      width: 64,
                      height: 64,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      bgcolor: "common.white",
                      color: "primary.main",
                      border: "2px solid",
                      borderColor: "primary.main",
                      boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
                      transition: "box-shadow 0.18s ease",
                    }}
                  >
                    <Icon sx={{ fontSize: 30 }} />
                    {/* Step number chip */}
                    <Box
                      sx={{
                        position: "absolute",
                        top: -6,
                        right: -6,
                        width: 24,
                        height: 24,
                        borderRadius: "50%",
                        bgcolor: "primary.main",
                        color: "primary.contrastText",
                        fontSize: "0.8rem",
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {index + 1}
                    </Box>
                  </Box>

                  <Typography variant="h6" component="h3" sx={{ mt: 2.5, mb: 0.75 }}>
                    {step.title}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ lineHeight: 1.6, maxWidth: 240 }}
                  >
                    {step.description}
                  </Typography>
                </Box>
              );

              return (
                <Grid key={step.title} size={{ xs: 12, sm: 6, md: 3 }}>
                  {isClickable ? (
                    <Box
                      component="a"
                      href={step.href!}
                      aria-label={step.ariaLabel}
                      {...(step.external
                        ? { target: "_blank", rel: "noopener noreferrer" }
                        : {})}
                      sx={{ display: "block", textDecoration: "none", color: "inherit" }}
                    >
                      {inner}
                    </Box>
                  ) : (
                    inner
                  )}
                </Grid>
              );
            })}
          </Grid>
        </Box>
      </Container>
    </Box>
  );
}
