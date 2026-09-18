"use client";

import * as React from "react";
import NextLink from "next/link";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import type { Vehicle } from "@/types/vehicle";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import {
  categoryLabel,
  formatDailyPrice,
  transmissionLabel,
  vehicleTitle,
  vehicleWhatsAppMessage,
} from "@/features/vehicles/format";

interface Props {
  vehicles: Vehicle[];
  whatsappNumber: string;
}

/**
 * Hero carousel of vehicles (Turo-style). One vehicle at a time with a large
 * photo; selecting it opens a WhatsApp quote for that vehicle. Autoplays,
 * pauses on hover, supports prev/next + dots. Client component.
 */
export default function HeroCarousel({ vehicles, whatsappNumber }: Props) {
  const [index, setIndex] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
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
    ? buildWhatsAppUrl(whatsappNumber, vehicleWhatsAppMessage(v))
    : undefined;
  const carouselImage = v.carouselImageUrl || v.imageUrl;
  const detailHref = `/vehicles/${v.id}`;

  return (
    <Box
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      sx={{ position: "relative" }}
    >
      <Box
        sx={{
          position: "relative",
          borderRadius: 3,
          overflow: "hidden",
          aspectRatio: { xs: "4 / 3", md: "3 / 2" },
          bgcolor: "grey.900",
        }}
      >
        {/* Clicking the photo/info opens the vehicle detail. */}
        <Box
          component={NextLink}
          href={detailHref}
          aria-label={`Ver ${vehicleTitle(v)}`}
          sx={{ position: "absolute", inset: 0, display: "block", textDecoration: "none" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            key={v.id}
            src={carouselImage}
            alt={vehicleTitle(v)}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
          />
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(to top, rgba(10,10,10,0.82) 0%, rgba(10,10,10,0.15) 45%, transparent 70%)",
            }}
          />
        </Box>

        {/* Vehicle info + action (over the link, WhatsApp button not part of it) */}
        <Box
          sx={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            p: { xs: 2.5, md: 3.5 },
            color: "common.white",
            pointerEvents: "none",
          }}
        >
          <Box
            component={NextLink}
            href={detailHref}
            sx={{ display: "block", textDecoration: "none", color: "inherit", pointerEvents: "auto" }}
          >
            <Typography variant="overline" sx={{ color: "grey.300", letterSpacing: "0.15em" }}>
              {categoryLabel(v.category)}
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, mb: 0.5 }}>
              {vehicleTitle(v)}
            </Typography>
            <Typography variant="body2" sx={{ color: "grey.300", mb: 2 }}>
              {v.passengers} pasajeros · {transmissionLabel(v.transmission)} · desde{" "}
              <Box component="span" sx={{ fontWeight: 700, color: "common.white" }}>
                {formatDailyPrice(v.dailyPrice)}
              </Box>{" "}
              / día
            </Typography>
          </Box>
          <Button
            component="a"
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            variant="contained"
            startIcon={<WhatsAppIcon />}
            data-wa-source="hero"
            data-wa-context={vehicleTitle(v)}
            disabled={!href}
            sx={{ pointerEvents: "auto" }}
          >
            Rentar
          </Button>
        </Box>

        {/* Prev / next */}
        {count > 1 && (
          <>
            <IconButton
              aria-label="Anterior"
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
              aria-label="Siguiente"
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

      {/* Dots */}
      {count > 1 && (
        <Box sx={{ display: "flex", justifyContent: "center", gap: 1, mt: 2 }}>
          {vehicles.map((veh, i) => (
            <Box
              key={veh.id}
              component="button"
              type="button"
              aria-label={`Ver ${vehicleTitle(veh)}`}
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
