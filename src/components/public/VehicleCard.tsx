"use client";

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
 * Vehicle card — the entire card navigates to the vehicle detail page.
 *
 * Pattern: the Card itself is rendered as an <a> (component="a") so every
 * pixel of the card is part of the link. The WhatsApp button calls
 * e.stopPropagation() to intercept its own click without triggering the
 * parent link navigation.
 *
 * This component is a Client Component only because stopPropagation requires
 * an event handler. No state is held; the "use client" boundary is minimal.
 */
export default function VehicleCard({ vehicle, whatsappNumber }: VehicleCardProps) {
  const title = vehicleTitle(vehicle);
  const displayTitle = vehicleTitleWithYearSimilar(vehicle);
  const message = vehicleWhatsAppMessage(vehicle);
  const coverFit = getFit(vehicle.imageFits, "cover");
  const detailHref = `/vehicles/${vehicle.id}`;

  return (
    <Card
      component="a"
      href={detailHref}
      aria-label={`Ver detalles de ${title}`}
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        textDecoration: "none",
        color: "inherit",
        cursor: "pointer",
        transition: "box-shadow 0.18s ease, transform 0.18s ease",
        "&:hover": {
          boxShadow: 6,
          transform: "translateY(-2px)",
        },
        "&:focus-visible": {
          outline: "2px solid",
          outlineColor: "primary.main",
          outlineOffset: 2,
        },
      }}
    >
      {/* Photo — 4:3 ratio */}
      <Box
        sx={{
          position: "relative",
          display: "block",
          aspectRatio: "4 / 3",
          bgcolor: "grey.100",
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
           * stopPropagation prevents the click from bubbling up to the
           * parent <a> (the card link), so tapping/clicking this button
           * only opens WhatsApp and does not navigate to the detail page.
           */}
          <Box
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
            sx={{ mt: 1.5 }}
          >
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
