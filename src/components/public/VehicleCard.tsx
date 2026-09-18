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
  vehicleWhatsAppMessage,
} from "@/features/vehicles/format";

interface VehicleCardProps {
  vehicle: Vehicle;
  whatsappNumber: string;
}

/**
 * Simple vehicle card. Fixed 4:3 photo (consistent across all images),
 * title, two key specs, price and a single WhatsApp CTA. Server Component.
 */
export default function VehicleCard({ vehicle, whatsappNumber }: VehicleCardProps) {
  const title = vehicleTitle(vehicle);
  const message = vehicleWhatsAppMessage(vehicle);

  return (
    <Card sx={{ width: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Photo: fixed 4:3 ratio, cover — always the same size regardless of image. */}
      <Box
        component="a"
        href={`/vehicles/${vehicle.id}`}
        sx={{ position: "relative", display: "block", aspectRatio: "4 / 3", bgcolor: "grey.100" }}
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
            objectFit: "cover",
            display: "block",
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

      <Box sx={{ p: 2.5, display: "flex", flexDirection: "column", flexGrow: 1 }}>
        <Typography variant="subtitle1" component="h3" sx={{ fontWeight: 700, mb: 1 }}>
          {title}
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
          <WhatsAppButton
            phoneNumber={whatsappNumber}
            message={message}
            label="Consultar disponibilidad"
            source="vehicle"
            context={title}
            fullWidth
            sx={{ mt: 1.5 }}
          />
        </Box>
      </Box>
    </Card>
  );
}
