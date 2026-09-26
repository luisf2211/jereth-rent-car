import type { Metadata } from "next";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Chip from "@mui/material/Chip";
import Link from "@mui/material/Link";
import Button from "@mui/material/Button";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import FlightLandRoundedIcon from "@mui/icons-material/FlightLandRounded";
import PlaceRoundedIcon from "@mui/icons-material/PlaceRounded";
import WhatsAppButton from "@/components/ui/WhatsAppButton";
import { getDeliveryLocations } from "@/features/delivery-locations/data";
import { getCompanySettings } from "@/lib/branding";
import { getI18n } from "@/i18n/server";
import type { TFunction } from "@/i18n/translate";
import { localizeDeliveryName, localizeDeliveryDescription } from "@/i18n/content-overrides";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getI18n();
  return {
    title: t("delivery.metaTitle"),
    description: t("delivery.metaDescription"),
  };
}

function formatFee(
  t: TFunction,
  hasFee: boolean,
  deliveryFee: number,
): { label: string; color: "success" | "default" } {
  if (!hasFee) return { label: t("delivery.freeDelivery"), color: "success" };
  if (deliveryFee > 0) return { label: `+US$${deliveryFee}`, color: "default" };
  return { label: t("delivery.extraChargeShort"), color: "default" };
}

export default async function LugaresDeEntregaPage() {
  const [locations, { whatsappNumber }, { t, locale }] = await Promise.all([
    getDeliveryLocations(),
    getCompanySettings(),
    getI18n(),
  ]);

  const message = t("delivery.coordinateInquiry");

  return (
    <Box sx={{ pb: { xs: 10, md: 0 } }}>
      <Container sx={{ pt: { xs: 10, md: 13 }, pb: { xs: 6, md: 9 } }}>
        {/* Breadcrumb */}
        <Box sx={{ mb: 3 }}>
          <Button
            component={Link}
            href="/#entrega"
            startIcon={<ArrowBackRoundedIcon />}
            color="secondary"
            size="small"
            sx={{ textTransform: "none", fontWeight: 500 }}
          >
            {t("delivery.backToHome")}
          </Button>
        </Box>

        {/* Header */}
        <Box sx={{ mb: { xs: 4, md: 6 } }}>
          <Typography variant="h3" component="h1" sx={{ fontWeight: 800, mb: 1 }}>
            {t("delivery.pageTitle")}
          </Typography>
          <Typography variant="subtitle1" color="text.secondary" sx={{ maxWidth: 600 }}>
            {t("delivery.pageSubtitle")}
          </Typography>
        </Box>

        {/* Locations grid */}
        {locations.length === 0 ? (
          <Typography color="text.secondary">
            {t("delivery.empty")}
          </Typography>
        ) : (
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, 1fr)",
                md: "repeat(3, 1fr)",
              },
              gap: { xs: 3, md: 4 },
            }}
          >
            {locations.map((loc) => {
              const fee = formatFee(t, loc.hasFee, loc.deliveryFee);
              // slug: e.g. "aeropuerto-las-americas" — used for deep-link from carousel
              const slug = loc.name
                .toLowerCase()
                .normalize("NFD")
                .replace(/[\u0300-\u036f]/g, "")
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-|-$/g, "");
              return (
                <Box
                  key={loc.id}
                  id={slug}
                  sx={{
                    borderRadius: 3,
                    border: "1px solid",
                    borderColor: "divider",
                    overflow: "hidden",
                    bgcolor: "background.paper",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  {/* Photo */}
                  <Box sx={{ position: "relative", aspectRatio: "4 / 3", bgcolor: "grey.900" }}>
                    {loc.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={loc.imageUrl}
                        alt={localizeDeliveryName(locale, loc.name)}
                        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                      />
                    ) : (
                      <Box
                        sx={{
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "rgba(255,255,255,0.35)",
                        }}
                      >
                        {loc.highlighted ? (
                          <FlightLandRoundedIcon sx={{ fontSize: 64 }} />
                        ) : (
                          <PlaceRoundedIcon sx={{ fontSize: 64 }} />
                        )}
                      </Box>
                    )}
                    <Chip
                      size="small"
                      label={fee.label}
                      color={fee.color}
                      sx={{
                        position: "absolute",
                        top: 12,
                        right: 12,
                        fontWeight: 700,
                        ...(fee.color === "default" && {
                          bgcolor: "rgba(10,10,10,0.72)",
                          color: "common.white",
                        }),
                      }}
                    />
                    {loc.highlighted && (
                      <Chip
                        size="small"
                        label={t("delivery.highlighted")}
                        sx={{
                          position: "absolute",
                          top: 12,
                          left: 12,
                          bgcolor: "primary.main",
                          color: "primary.contrastText",
                          fontWeight: 700,
                        }}
                      />
                    )}
                  </Box>

                  {/* Body */}
                  <Box sx={{ p: 2.5, flexGrow: 1, display: "flex", flexDirection: "column" }}>
                    <Stack direction="row" spacing={0.75} sx={{ mb: 0.5, alignItems: "center" }}>
                      <Box sx={{ color: "primary.main", display: "flex" }}>
                        {loc.highlighted ? (
                          <FlightLandRoundedIcon fontSize="small" />
                        ) : (
                          <PlaceRoundedIcon fontSize="small" />
                        )}
                      </Box>
                      <Typography variant="subtitle1" component="h2" sx={{ fontWeight: 700 }}>
                        {localizeDeliveryName(locale, loc.name)}
                      </Typography>
                    </Stack>

                    {loc.description && (
                      <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.6, mb: 1 }}>
                        {localizeDeliveryDescription(locale, loc.description)}
                      </Typography>
                    )}

                    {loc.mapUrl && (
                      <Link
                        href={loc.mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        underline="hover"
                        variant="body2"
                        sx={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 0.5,
                          mt: "auto",
                          pt: 1,
                          color: "primary.main",
                        }}
                      >
                        <PlaceRoundedIcon sx={{ fontSize: 16 }} /> {t("delivery.viewOnMap")}
                      </Link>
                    )}
                  </Box>
                </Box>
              );
            })}
          </Box>
        )}

        {/* WhatsApp CTA */}
        <Box sx={{ mt: { xs: 5, md: 7 }, textAlign: "center" }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
            {t("delivery.otherPointTitle")}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            {t("delivery.otherPointSubtitle")}
          </Typography>
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
