"use client";

import * as React from "react";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import type { Vehicle } from "@/types/vehicle";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { formatDailyPrice } from "@/features/vehicles/format";
import { useI18n } from "@/i18n/LanguageProvider";
import {
  categoryLabelI18n,
  transmissionLabelI18n,
  vehicleTitleI18n,
  vehicleWhatsAppMessageI18n,
} from "@/i18n/vehicle-labels";
import { getFit, fitToStyle } from "@/lib/image-fit";
import { vehiclePath } from "@/features/vehicles/vehicle-url";

interface Props {
  vehicles: Vehicle[];
  whatsappNumber: string;
  /** When true (Reservas Digitales ON) also show a "Reservar" digital action. */
  digitalEnabled?: boolean;
}

/**
 * Hero carousel of vehicles (Turo-style). One vehicle at a time: a large clean
 * photo on top and, below it, an organized info block (category, title, specs,
 * price and the "Rentar" action). Autoplays, pauses on hover, supports
 * prev/next + dots. Client component.
 */
export default function HeroCarousel({ vehicles, whatsappNumber, digitalEnabled = false }: Props) {
  const router = useRouter();
  const { t } = useI18n();
  const [index, setIndex] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const [starting, setStarting] = React.useState(false);
  const count = vehicles.length;

  const go = React.useCallback(
    (n: number) => setIndex((prev) => (prev + n + count) % count),
    [count]
  );

  React.useEffect(() => {
    if (count <= 1 || paused) return;
    const id = setInterval(() => setIndex((p) => (p + 1) % count), 5000);
    return () => clearInterval(id);
  }, [count, paused]);

  if (count === 0) return null;

  const v = vehicles[index];
  const href = whatsappNumber
    ? buildWhatsAppUrl(whatsappNumber, vehicleWhatsAppMessageI18n(t, v))
    : undefined;
  const carouselImage = v.carouselImageUrl || v.imageUrl;
  // Use "carousel" framing when a dedicated carousel photo exists, otherwise
  // fall back to "cover" framing (same image used in both slots).
  const carouselFitKey = v.carouselImageUrl ? "carousel" : "cover";
  const carouselFit = getFit(v.imageFits, carouselFitKey);
  const detailHref = vehiclePath(v);

  // Digital reservation for the CURRENT slide's vehicle: open the reservation
  // FORM (no DB write yet) with the vehicle preselected; dates/locations are
  // chosen there and the reservation is only created on final submit. This
  // avoids "ghost" reservations when the customer abandons the form.
  const handleReservar = () => {
    if (starting) return;
    setStarting(true);
    router.push(`/reservar/nuevo?vehicleId=${encodeURIComponent(v.id)}`);
  };

  return (
    <Box
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      sx={{
        position: "relative",
        borderRadius: 3,
        overflow: "hidden",
        border: "1px solid",
        borderColor: "divider",
        bgcolor: "background.paper",
      }}
    >
      {/* Photo (clickable → detail) */}
      <Box sx={{ position: "relative" }}>
        <Box
          component={NextLink}
          href={detailHref}
          aria-label={t("hero.viewVehicle", { title: vehicleTitleI18n(t, v) })}
          sx={{
            display: "block",
            aspectRatio: { xs: "16 / 10", md: "16 / 9" },
            bgcolor: "grey.900",
          }}
        >
          <Image
            key={v.id}
            src={carouselImage}
            alt={vehicleTitleI18n(t, v)}
            fill
            // The hero is above the fold and is the likely LCP element, so the
            // FIRST slide is prioritized; the rest load on demand.
            priority={index === 0}
            sizes="(max-width: 900px) 100vw, 66vw"
            style={{ display: "block", ...fitToStyle(carouselFit) }}
          />
        </Box>

        {/* Prev / next */}
        {count > 1 && (
          <>
            <IconButton
              aria-label={t("hero.prev")}
              onClick={() => go(-1)}
              sx={{
                position: "absolute",
                top: "50%",
                left: 10,
                transform: "translateY(-50%)",
                bgcolor: "rgba(255,255,255,0.9)",
                "&:hover": { bgcolor: "common.white" },
              }}
            >
              <ChevronLeftRoundedIcon />
            </IconButton>
            <IconButton
              aria-label={t("hero.next")}
              onClick={() => go(1)}
              sx={{
                position: "absolute",
                top: "50%",
                right: 10,
                transform: "translateY(-50%)",
                bgcolor: "rgba(255,255,255,0.9)",
                "&:hover": { bgcolor: "common.white" },
              }}
            >
              <ChevronRightRoundedIcon />
            </IconButton>
          </>
        )}
      </Box>

      {/* Info block below the photo. Colors are set explicitly so the block
          stays legible even when the hero section renders light text over a
          background photo (the info block has its own white surface). */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        sx={{
          p: { xs: 2, md: 2.5 },
          gap: { xs: 1.5, sm: 2 },
          justifyContent: "space-between",
          alignItems: { xs: "stretch", sm: "flex-end" },
          color: "text.primary",
        }}
      >
        <Box
          component={NextLink}
          href={detailHref}
          sx={{ minWidth: 0, textDecoration: "none", color: "text.primary" }}
        >
          <Typography
            variant="overline"
            sx={{ color: "text.secondary", letterSpacing: "0.14em", lineHeight: 1.6 }}
          >
            {categoryLabelI18n(t, v.category)}
          </Typography>
          <Typography
            sx={{
              fontWeight: 800,
              fontSize: { xs: "1.2rem", md: "1.4rem" },
              lineHeight: 1.2,
              mb: 0.75,
              color: "text.primary",
            }}
          >
            {vehicleTitleI18n(t, v)}
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }}>
            {t("hero.specsLine", {
              passengers: v.passengers,
              transmission: transmissionLabelI18n(t, v.transmission),
            })}
          </Typography>
          <Typography variant="body2" sx={{ color: "text.primary", mt: 0.25 }}>
            {t("hero.fromLabel")}{" "}
            <Box component="span" sx={{ fontWeight: 800 }}>
              {formatDailyPrice(v.dailyPrice)}
            </Box>{" "}
            {t("hero.perDay")}
          </Typography>
        </Box>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          sx={{ flexShrink: 0, alignSelf: { xs: "stretch", sm: "flex-end" } }}
        >
          <Button
            component="a"
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            variant={digitalEnabled ? "outlined" : "contained"}
            startIcon={<WhatsAppIcon />}
            data-wa-source="hero"
            data-wa-context={vehicleTitleI18n(t, v)}
            disabled={!href}
            sx={{ flexShrink: 0 }}
          >
            {t("hero.rent")}
          </Button>
          {digitalEnabled && (
            <Button
              variant="contained"
              startIcon={<EventAvailableRoundedIcon />}
              onClick={handleReservar}
              disabled={starting}
              sx={{ flexShrink: 0 }}
            >
              {starting ? t("vehicle.starting") : t("vehicle.reserve")}
            </Button>
          )}
        </Stack>
      </Stack>

      {/* Dots */}
      {count > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", gap: 1, pb: 2 }}>
          {vehicles.map((veh, i) => (
            <Box
              key={veh.id}
              component="button"
              type="button"
              aria-label={t("hero.viewVehicle", { title: vehicleTitleI18n(t, veh) })}
              onClick={() => setIndex(i)}
              sx={{
                p: 0,
                border: "none",
                cursor: "pointer",
                height: 6,
                width: i === index ? 24 : 6,
                borderRadius: 999,
                bgcolor: i === index ? "primary.main" : "grey.400",
                transition: "width 200ms ease, background-color 200ms ease",
              }}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}
