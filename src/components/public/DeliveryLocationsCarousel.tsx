"use client";

import * as React from "react";
import NextLink from "next/link";
import Image from "next/image";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";
import IconButton from "@mui/material/IconButton";
import FlightLandRoundedIcon from "@mui/icons-material/FlightLandRounded";
import PlaceRoundedIcon from "@mui/icons-material/PlaceRounded";
import ChevronLeftRoundedIcon from "@mui/icons-material/ChevronLeftRounded";
import ChevronRightRoundedIcon from "@mui/icons-material/ChevronRightRounded";
import type { DeliveryLocationItem } from "@/features/delivery-locations/data";
import { useI18n } from "@/i18n/LanguageProvider";
import type { TFunction } from "@/i18n/translate";

interface Props {
  locations: DeliveryLocationItem[];
}

function formatFee(t: TFunction, loc: DeliveryLocationItem): string {
  if (!loc.hasFee) return t("delivery.freeDelivery");
  return loc.deliveryFee > 0 ? `+US$${loc.deliveryFee}` : t("delivery.extraChargeShort");
}

/** Derive a URL-safe slug from a location name for deep-linking. */
function toSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function LocationCard({ loc }: { loc: DeliveryLocationItem }) {
  const { t } = useI18n();
  const slug = toSlug(loc.name);
  const href = `/lugares-de-entrega#${slug}`;

  return (
    <Card
      component={NextLink}
      href={href}
      aria-label={t("delivery.viewDetailsOf", { name: loc.name })}
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        textDecoration: "none",
        cursor: "pointer",
        // Subtle scale on hover — uses transform so it doesn't shift other cards
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        "&:hover": {
          transform: "scale(1.03)",
          boxShadow: 6,
          "& .loc-map-link": { color: "primary.main" },
        },
        "&:focus-visible": {
          outline: "2px solid",
          outlineColor: "primary.main",
          outlineOffset: 2,
        },
      }}
    >
      {/* Photo */}
      <Box sx={{ position: "relative", aspectRatio: "4 / 3", bgcolor: "grey.900" }}>
        {loc.imageUrl ? (
          <Image
            src={loc.imageUrl}
            alt={loc.name}
            fill
            sizes="(max-width: 600px) 82vw, (max-width: 900px) 48vw, 32vw"
            style={{ objectFit: "cover", display: "block" }}
          />
        ) : (
          <Box
            sx={{
              width: "100%",
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "rgba(255,255,255,0.4)",
            }}
          >
            {loc.highlighted ? (
              <FlightLandRoundedIcon sx={{ fontSize: 56 }} />
            ) : (
              <PlaceRoundedIcon sx={{ fontSize: 56 }} />
            )}
          </Box>
        )}
        <Chip
          size="small"
          label={formatFee(t, loc)}
          sx={{
            position: "absolute",
            top: 12,
            right: 12,
            bgcolor: loc.hasFee ? "rgba(10,10,10,0.72)" : "success.main",
            color: "common.white",
            fontWeight: 700,
          }}
        />
      </Box>

      {/* Body */}
      <Box sx={{ p: 2.25, display: "flex", flexDirection: "column", flexGrow: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, mb: 0.5 }}>
          <Box sx={{ color: "primary.main", display: "flex" }}>
            {loc.highlighted ? <FlightLandRoundedIcon fontSize="small" /> : <PlaceRoundedIcon fontSize="small" />}
          </Box>
          <Typography variant="subtitle1" component="h3" sx={{ fontWeight: 700 }}>
            {loc.name}
          </Typography>
        </Box>
        {loc.description && (
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55 }}>
            {loc.description}
          </Typography>
        )}
        {loc.mapUrl && (
          <Link
            className="loc-map-link"
            href={loc.mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            underline="hover"
            variant="body2"
            onClick={(e) => e.stopPropagation()}
            sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, mt: "auto", pt: 1.25 }}
          >
            <PlaceRoundedIcon sx={{ fontSize: 16 }} /> {t("delivery.viewOnMap")}
          </Link>
        )}
      </Box>
    </Card>
  );
}

/**
 * Infinite/circular carousel of delivery locations.
 * - Duplicates items so the track loops seamlessly without gaps.
 * - Auto-scrolls every 3.5s, pauses on hover/focus.
 * - Prev/Next buttons step one card at a time.
 * - On mobile, native horizontal scroll + snap works for swipe.
 * - Cards are fully clickable → /lugares-de-entrega#<slug>.
 * - Desktop hover: card scales up subtly (transform, no layout shift).
 */
export default function DeliveryLocationsCarousel({ locations }: Props) {
  const { t } = useI18n();
  const trackRef = React.useRef<HTMLDivElement>(null);
  const [paused, setPaused] = React.useState(false);
  const count = locations.length;

  // Duplicate items for infinite feel (original + 1 extra copy).
  // We reset scroll silently when reaching the duplicate zone.
  const items = count > 1 ? [...locations, ...locations] : locations;

  const getCardWidth = React.useCallback((): number => {
    const track = trackRef.current;
    if (!track) return 300;
    const firstCard = track.querySelector<HTMLElement>("[data-card]");
    const gap = 24;
    return firstCard ? firstCard.offsetWidth + gap : track.clientWidth * 0.82 + gap;
  }, []);

  const step = React.useCallback(
    (dir: 1 | -1) => {
      const track = trackRef.current;
      if (!track) return;
      const cardWidth = getCardWidth();
      let next = track.scrollLeft + dir * cardWidth;
      const halfScroll = track.scrollWidth / 2;

      // Seamless loop: if we've scrolled past the first copy, snap back silently.
      if (next >= halfScroll) {
        track.scrollLeft = next - halfScroll;
        next = track.scrollLeft + dir * cardWidth;
      } else if (next < 0) {
        track.scrollLeft = halfScroll + next;
        next = track.scrollLeft;
      }
      track.scrollTo({ left: next, behavior: "smooth" });
    },
    [getCardWidth]
  );

  // Auto-advance every 3.5s
  React.useEffect(() => {
    if (count <= 1 || paused) return;
    const id = setInterval(() => step(1), 3500);
    return () => clearInterval(id);
  }, [count, paused, step]);

  if (count === 0) return null;

  return (
    <Box
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      sx={{ position: "relative" }}
    >
      <Box
        ref={trackRef}
        sx={{
          display: "flex",
          gap: 3,
          overflowX: "auto",
          scrollSnapType: "x mandatory",
          pb: 1,
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
          // Give each card room to scale without clipping
          py: 1,
          mx: -0.5,
          px: 0.5,
        }}
      >
        {items.map((loc, i) => (
          <Box
            key={`${loc.id}-${i}`}
            data-card
            sx={{
              flex: {
                xs: "0 0 82%",
                sm: "0 0 48%",
                md: "0 0 32%",
                lg: "0 0 31%",
              },
              scrollSnapAlign: "start",
              // overflow visible so the scale transform isn't clipped
              overflow: "visible",
            }}
          >
            <LocationCard loc={loc} />
          </Box>
        ))}
      </Box>

      {count > 1 && (
        <>
          <IconButton
            aria-label={t("common.prev")}
            onClick={() => step(-1)}
            sx={{
              position: "absolute",
              top: "38%",
              left: 8,
              transform: "translateY(-50%)",
              bgcolor: "common.white",
              boxShadow: 2,
              "&:hover": { bgcolor: "common.white" },
            }}
          >
            <ChevronLeftRoundedIcon />
          </IconButton>
          <IconButton
            aria-label={t("common.next")}
            onClick={() => step(1)}
            sx={{
              position: "absolute",
              top: "38%",
              right: 8,
              transform: "translateY(-50%)",
              bgcolor: "common.white",
              boxShadow: 2,
              "&:hover": { bgcolor: "common.white" },
            }}
          >
            <ChevronRightRoundedIcon />
          </IconButton>
        </>
      )}
    </Box>
  );
}
