"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
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
 * Vehicle card.
 *
 * Two independent actions:
 *  - Click anywhere on the card (photo, title, specs, price, empty space)
 *    → navigate to /vehicles/[id]  (via router.push)
 *  - Click "Consultar disponibilidad" → opens WhatsApp (href on the button)
 *
 * Why not Card as <a>: WhatsAppButton is itself an <a>. Nesting <a> inside
 * <a> is invalid HTML — browsers break the inner link. Instead the Card uses
 * onClick for navigation and the WhatsApp wrapper calls stopPropagation so
 * its click never reaches the card handler.
 *
 * Keyboard: the WhatsApp button is still reachable via Tab because it is a
 * real <a> in the DOM. The card itself is not in the tab order (no href),
 * so keyboard users navigate directly to the button.
 */
export default function VehicleCard({ vehicle, whatsappNumber }: VehicleCardProps) {
  const router = useRouter();
  const title = vehicleTitle(vehicle);
  const displayTitle = vehicleTitleWithYearSimilar(vehicle);
  const message = vehicleWhatsAppMessage(vehicle);
  const coverFit = getFit(vehicle.imageFits, "cover");
  const detailHref = `/vehicles/${vehicle.id}`;

  const handleCardClick = () => {
    router.push(detailHref);
  };

  return (
    <Card
      onClick={handleCardClick}
      role="link"
      tabIndex={-1}          // keyboard users reach the WhatsApp <a> directly
      aria-label={`Ver detalles de ${title}`}
      sx={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        cursor: "pointer",
        transition: "box-shadow 0.18s ease, transform 0.18s ease",
        "&:hover": {
          boxShadow: 6,
          transform: "translateY(-2px)",
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
        <Image
          src={vehicle.imageUrl}
          alt={title}
          fill
          // Cards are below the fold; lazy by default (no priority). Responsive
          // sizes so mobile downloads a small variant, not the full-res photo.
          sizes="(max-width: 600px) 100vw, (max-width: 900px) 50vw, 25vw"
          style={{ display: "block", ...fitToStyle(coverFit) }}
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
           * stopPropagation: prevents the click from bubbling up to the Card's
           * onClick handler, so the WhatsApp <a> opens its own href (wa.me)
           * without also triggering navigation to the detail page.
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
