import * as React from "react";
import Card from "@mui/material/Card";
import CardMedia from "@mui/material/CardMedia";
import CardContent from "@mui/material/CardContent";
import CardActions from "@mui/material/CardActions";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import SettingsSuggestRoundedIcon from "@mui/icons-material/SettingsSuggestRounded";
import PeopleAltRoundedIcon from "@mui/icons-material/PeopleAltRounded";
import type { Vehicle } from "@/types/vehicle";
import WhatsAppButton from "@/components/ui/WhatsAppButton";
import {
  formatDailyPrice,
  transmissionLabel,
  vehicleTitle,
} from "@/features/vehicles/format";

interface VehicleCardProps {
  vehicle: Vehicle;
  whatsappNumber: string;
}

/**
 * Reusable vehicle card for the public catalog and featured section.
 * Server Component: no interactivity beyond links.
 */
export default function VehicleCard({ vehicle, whatsappNumber }: VehicleCardProps) {
  const title = vehicleTitle(vehicle);
  const message = `Hola, estoy interesado en rentar el ${title}. ¿Está disponible?`;

  return (
    <Card sx={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <CardMedia
        component="img"
        image={vehicle.imageUrl}
        alt={title}
        sx={{ aspectRatio: "4 / 3", objectFit: "cover" }}
      />
      <CardContent sx={{ flexGrow: 1 }}>
        <Typography variant="h6" component="h3" sx={{ mb: 1 }}>
          {title}
        </Typography>
        <Stack direction="row" spacing={2} sx={{ color: "text.secondary", mb: 1.5 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <SettingsSuggestRoundedIcon fontSize="small" />
            <Typography variant="body2">{transmissionLabel(vehicle.transmission)}</Typography>
          </Box>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <PeopleAltRoundedIcon fontSize="small" />
            <Typography variant="body2">{vehicle.passengers} pasajeros</Typography>
          </Box>
        </Stack>
        <Typography variant="h6" component="p" color="primary.main" sx={{ fontWeight: 700 }}>
          {formatDailyPrice(vehicle.dailyPrice)}
          <Typography component="span" variant="body2" color="text.secondary">
            {" "}
            / día
          </Typography>
        </Typography>
      </CardContent>
      <CardActions sx={{ p: 2, pt: 0, gap: 1, flexWrap: "wrap" }}>
        <Button
          href={`/vehicles/${vehicle.id}`}
          variant="outlined"
          color="secondary"
          fullWidth
        >
          Ver vehículo
        </Button>
        <WhatsAppButton
          phoneNumber={whatsappNumber}
          message={message}
          label="Reservar por WhatsApp"
          fullWidth
        />
      </CardActions>
    </Card>
  );
}
