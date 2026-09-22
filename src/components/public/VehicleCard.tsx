import * as React from "react";
import Card from "@mui/material/Card";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Typography from "@mui/material/Typography";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import SettingsSuggestRoundedIcon from "@mui/icons-material/SettingsSuggestRounded";
import type { Vehicle } from "@/types/vehicle";
import WhatsAppButton from "@/components/ui/WhatsAppButton";
import {
  categoryLabel,
  formatDailyPrice,
  transmissionLabel,
  vehicleTitle,
  vehicleTitleWithYearSimilar,
  vehicleWhatsAppMessage,
} from "@/features/vehicles/format";
import { getFit, fitToStyle } from "@/lib/image-fit";

interface VehicleCardProps {
  vehicle: Vehicle;
  whatsappNumber: string;
}

/**
 * Vehicle card — the entire card is a link to the detail page.
 *
 * Accessibility pattern: the card wraps content in a <a> (the "stretched
 * link"). The WhatsApp button lives inside and uses `position: relative` +
 * `z-index: 1` to sit above the card link, so clicks on it fire WhatsApp
 * instead of navigating. This is the standard "stretched link" technique.
 *
 * - Keyboard: Tab reaches both the card link and the WhatsApp button.
 * - Screen readers: the card link has a descriptive aria-label; the button
 *   keeps its own accessible name.
 * - Mobile: tapping the button opens WhatsApp; tapping anywhere else
 *   navigates to the detail page.
 */
export default function VehicleCard({ vehicle, whatsappNumber }: VehicleCardProps) {
  const title = vehicleTitle(vehicle);
  const displayTitle = vehicleTitleWithYearSimilar(vehicle);
  const message = vehicleWhatsAppMessage(vehicle);
  const coverFit = getFit(vehicle.imageFits, "cover");
  const detailHref = `/vehicles/${vehicle.id}`;

  return (
    <Card
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        // Stretched-link container
        position: "relative",
        cursor: "pointer",
        transition: "box-shadow 0.18s ease, transform 0.18s ease",
        "&:hover": {
          boxShadow: 6,
          transform: "translateY(-2px)",
        },
        "&:focus-within a.card-link:focus": {
          outline: "none", // focus ring shown on the <a> itself via focus-visible
        },
      }}
    >
      {/*
       * Stretched link: covers the full card via pseudo-element.
       * Must be positioned before interactive children so z-index stacking
       * works correctly (children get z-index: 1 to sit above it).
       */}
      <Box
        className="card-link"
        component="a"
        href={detailHref}
        aria-label={`Ver detalles de ${title}`}
        sx={{
          position: "absolute",
          inset: 0,
          zIndex: 0,
          // Visually hidden — the stretched pseudo covers the card area
          "&::after": {
            content: '""',
            position: "absolute",
            inset: 0,
          },
          "&:focus-visible": {
            outline: "2px solid",
            outlineColor: "primary.main",
            outlineOffset: -2,
          },
        }}
      />

      {/* Photo — 4:3 ratio */}
      <Box
        sx={{
          position: "relative",
          display: "block",
          aspectRatio: "4 / 3",
          bgcolor: "grey.100",
          zIndex: 0,
        }}
      >
        <Box
          component="img"
          src={vehicle.imageUrl}
          alt={title}
          loading="lazy"
          sx={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            display: "block",
            ...fitToStyle(coverFit),
          }}
        />
        <Chip
          label={categoryLabel(vehicle.category)}
          size="small"
          sx={{
            position: "absolute",
            top: 12,
            left: 12,
            bgcolor: "rgba(10,10,10,0.72)",
            color: "common.white",
            // Sit above the stretched link
            zIndex: 1,
          }}
        />
      </Box>

      {/* Card body */}
      <Box sx={{ p: 2.5, display: "flex", flexDirection: "column", flexGrow: 1 }}>
        <Typography variant="subtitle1" component="h3" sx={{ fontWeight: 700, mb: 1 }}>
          {displayTitle}
        </Typography>

        <Box sx={{ display: "flex", gap: 2, color: "text.secondary", mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <PeopleAltRoundedIcon fontSize="small" />
            <Typography variant="body2">{vehicle.passengers}</Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <SettingsSuggestRoundedIcon fontSize="small" />
            <Typography variant="body2">{transmissionLabel(vehicle.transmission)}</Typography>
          </Box>
        </Box>

        <Box sx={{ mt: "auto" }}>
          <Typography variant="body2" color="text.secondary" component="p">
            Desde{" "}
            <Box component="span" sx={{ fontWeight: 800, fontSize: "1.15rem", color: "text.primary" }}>
              {formatDailyPrice(vehicle.dailyPrice)}
            </Box>{" "}
            / día
          </Typography>
          {/*
           * z-index: 1 puts the button above the stretched card link so clicks
           * fire the WhatsApp action, not the card navigation.
           */}
          <Box sx={{ position: "relative", zIndex: 1, mt: 1.5 }}>
            <WhatsAppButton
              phoneNumber={whatsappNumber}
              message={message}
              label="Consultar disponibilidad"
              source="vehicle"
              context={title}
              fullWidth
            />
          </Box>
        </Box>
      </Box>
    </Card>
  );
}
