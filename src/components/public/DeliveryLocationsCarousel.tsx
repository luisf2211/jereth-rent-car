"use client";

import * as React from "react";
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

interface Props {
  locations: DeliveryLocationItem[];
}

function formatFee(loc: DeliveryLocationItem): string {
  if (!loc.hasFee) return "Entrega gratis";
  return loc.deliveryFee > 0 ? `+US$${loc.deliveryFee}` : "Cargo adicional";
}

function LocationCard({ loc }: { loc: DeliveryLocationItem }) {
  return (
    <Card sx={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Photo */}
      <Box sx={{ position: "relative", aspectRatio: "4 / 3", bgcolor: "grey.900" }}>
        {loc.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={loc.imageUrl}
            alt={loc.name}
            loading="lazy"
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
          label={formatFee(loc)}
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
            href={loc.mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            underline="hover"
            variant="body2"
            sx={{ display: "inline-flex", alignItems: "center", gap: 0.5, mt: "auto", pt: 1.25 }}
          >
            <PlaceRoundedIcon sx={{ fontSize: 16 }} /> Ver en el mapa
          </Link>
        )}
      </Box>
    </Card>
  );
}

/**
 * Card carousel of delivery/pickup locations with their real photos. Shows
 * several cards per view on a horizontal track that auto-scrolls, pausing on
 * hover. Prev/next step the track; on touch it scrolls natively. When there
 * are few locations it simply lays them out without controls. Client comp.
 */
export default function DeliveryLocationsCarousel({ locations }: Props) {
  const trackRef = React.useRef<HTMLDivElement>(null);
  const [paused, setPaused] = React.useState(false);
  const count = locations.length;

  const step = React.useCallback((dir: 1 | -1) => {
    const track = trackRef.current;
    if (!track) return;
    const firstCard = track.querySelector<HTMLElement>("[data-card]");
    const gap = 24;
    const amount = firstCard ? firstCard.offsetWidth + gap : track.clientWidth * 0.8;
    let next = track.scrollLeft + dir * amount;
    // Loop back to the start/end for a continuous feel.
    const maxScroll = track.scrollWidth - track.clientWidth;
    if (next > maxScroll + 4) next = 0;
    if (next < 0) next = maxScroll;
    track.scrollTo({ left: next, behavior: "smooth" });
  }, []);

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
          // Hide scrollbar; the carousel is driven by autoplay + buttons.
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
        }}
      >
        {locations.map((loc) => (
          <Box
            key={loc.id}
            data-card
            sx={{
              flex: {
                xs: "0 0 82%",
                sm: "0 0 48%",
                md: "0 0 32%",
                lg: "0 0 31%",
              },
              scrollSnapAlign: "start",
            }}
          >
            <LocationCard loc={loc} />
          </Box>
        ))}
      </Box>

      {count > 1 && (
        <>
          <IconButton
            aria-label="Anterior"
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
            aria-label="Siguiente"
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
