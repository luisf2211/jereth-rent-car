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
import { localizeDeliveryName, localizeDeliveryDescription } from "@/i18n/content-overrides";

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
  const { t, locale } = useI18n();
  // Slug uses the ORIGINAL name so the deep-link matches the anchors on the
  // full page (which also slugify the original name). Only the visible text is
  // localized.
  const slug = toSlug(loc.name);
  const href = `/lugares-de-entrega#${slug}`;
  const name = localizeDeliveryName(locale, loc.name);
  const description = localizeDeliveryDescription(locale, loc.description);

  return (
    <Card
      component={NextLink}
      href={href}
      aria-label={t("delivery.viewDetailsOf", { name })}
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
            alt={name}
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
            {name}
          </Typography>
        </Box>
        {description && (
          <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55 }}>
            {description}
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
 * Horizontal carousel of delivery locations.
 *
 * Mechanics (rewritten to fix the arrow/scroll bugs):
 *  - The track is a horizontally-scrollable flex row; native drag/swipe still
 *    works on touch. Cards keep their exact previous sizes (flex-basis).
 *  - Prev/Next scroll the track horizontally by one card using the actual
 *    child offset (deterministic), NOT a fragile scrollWidth/2 heuristic.
 *  - When items > visible, the list is duplicated for a circular feel; the
 *    scroll position is silently normalized back into the first copy AFTER the
 *    smooth scroll settles (no fighting between smooth-scroll and scroll-snap,
 *    which caused the freeze). scroll-snap is removed for the same reason.
 *  - Only the horizontal scrollLeft of the track is changed, so the PAGE never
 *    scrolls vertically when using the arrows.
 *  - Autoplay every 4s, paused on hover. Cards remain clickable.
 */
export default function DeliveryLocationsCarousel({ locations }: Props) {
  const { t } = useI18n();
  const trackRef = React.useRef<HTMLDivElement>(null);
  const [paused, setPaused] = React.useState(false);
  const animatingRef = React.useRef(false);
  const count = locations.length;

  // Duplicate for a circular feel only when there is more than one card.
  const items = count > 1 ? [...locations, ...locations] : locations;

  /** Pixels between the start of consecutive cards (card width + gap). */
  const cardStride = React.useCallback((): number => {
    const track = trackRef.current;
    if (!track) return 320;
    const cards = track.querySelectorAll<HTMLElement>("[data-card]");
    if (cards.length >= 2) {
      // Real distance between two cards' left edges (includes the gap).
      return cards[1].offsetLeft - cards[0].offsetLeft;
    }
    return cards[0] ? cards[0].offsetWidth : track.clientWidth;
  }, []);

  const step = React.useCallback(
    (dir: 1 | -1) => {
      const track = trackRef.current;
      if (!track || animatingRef.current) return;

      const stride = cardStride();
      // Width of ONE copy of the list (half the scrollable width when duplicated).
      const copyWidth = count > 1 ? track.scrollWidth / 2 : track.scrollWidth;

      // Reposition into a safe range BEFORE moving so BOTH directions always
      // have room to animate (this is what makes the loop circular and stops
      // the left arrow from doing nothing at scrollLeft = 0).
      if (count > 1) {
        if (dir === -1 && track.scrollLeft < stride) {
          // Near the start: jump forward by one copy (same cards) so we can
          // animate left into the previous card without clamping at 0.
          track.scrollLeft = track.scrollLeft + copyWidth;
        } else if (dir === 1 && track.scrollLeft >= copyWidth) {
          // Past the first copy going forward: wrap back so we never run out.
          track.scrollLeft = track.scrollLeft - copyWidth;
        }
      }

      const target = track.scrollLeft + dir * stride;
      animatingRef.current = true;
      track.scrollTo({ left: target, behavior: "smooth" });

      // After the smooth scroll settles, silently wrap back into the first
      // copy if we ran past it. Done once, without behavior:"smooth", so it
      // never fights the animation nor freezes.
      window.setTimeout(() => {
        if (count > 1) {
          if (track.scrollLeft >= copyWidth) {
            track.scrollLeft = track.scrollLeft - copyWidth;
          } else if (track.scrollLeft < 0) {
            track.scrollLeft = track.scrollLeft + copyWidth;
          }
        }
        animatingRef.current = false;
      }, 450);
    },
    [cardStride, count],
  );

  // Autoplay every 4s, paused on hover.
  React.useEffect(() => {
    if (count <= 1 || paused) return;
    const id = setInterval(() => step(1), 4000);
    return () => clearInterval(id);
  }, [count, paused, step]);

  if (count === 0) return null;

  return (
    <Box
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      sx={{ position: "relative" }}
    >
      <Box
        ref={trackRef}
        sx={{
          display: "flex",
          gap: 3,
          overflowX: "auto",
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
            type="button"
            aria-label={t("common.prev")}
            // Prevent the button from taking focus (avoids the browser scrolling
            // the page to the focused control = the vertical "jump").
            onMouseDown={(e) => e.preventDefault()}
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
            type="button"
            aria-label={t("common.next")}
            onMouseDown={(e) => e.preventDefault()}
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
