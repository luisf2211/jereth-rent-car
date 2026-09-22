"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import Divider from "@mui/material/Divider";
import Drawer from "@mui/material/Drawer";
import IconButton from "@mui/material/IconButton";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import Alert from "@mui/material/Alert";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { formatDailyPrice } from "@/features/vehicles/format";
import { rentalDays, meetsMinimumRental, MIN_RENTAL_DAYS } from "@/utils/rental-days";
import { trackEvent } from "@/lib/analytics";

/** Delivery location option. `hasFee` marks a paid location; `deliveryFee`
 *  is the amount (may be 0 = "Cargo adicional" label without a price). */
export interface BookingLocation {
  id: string;
  name: string;
  hasFee: boolean;
  deliveryFee: number;
}

interface Props {
  vehicleTitle: string;
  dailyPrice: number;
  whatsappNumber: string;
  /** Delivery/pickup locations with their fees (from the delivery module). */
  locations: BookingLocation[];
}

const DEFAULT_PICKUP_TIME = "10:00";
const DEFAULT_DROPOFF_TIME = "10:00";

function formatDate(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

/**
 * Booking tarifario. Desktop: sticky card in the right column. Mobile: fixed
 * bottom bar that opens a drawer with the same fields. The customer picks
 * dates, pickup/return times and pickup/return locations; the total is
 * computed live as days × dailyPrice + pickup fee + return fee. Days follow
 * the industry rule (see utils/rental-days): a return before 5pm is still a
 * full day and adds no extra day; from 5pm a late return adds one day.
 * The CTA opens a WhatsApp quote with the full breakdown. No availability
 * engine yet — this is a transparent quote.
 */
export default function VehicleBooking({ vehicleTitle, dailyPrice, whatsappNumber, locations }: Props) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const [pickupDate, setPickupDate] = React.useState("");
  const [dropoffDate, setDropoffDate] = React.useState("");
  const [pickupTime, setPickupTime] = React.useState(DEFAULT_PICKUP_TIME);
  const [dropoffTime, setDropoffTime] = React.useState(DEFAULT_DROPOFF_TIME);
  const [pickupLocationId, setPickupLocationId] = React.useState("");
  const [dropoffLocationId, setDropoffLocationId] = React.useState("");
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const hasLocations = locations.length > 0;
  const findLoc = (id: string) => locations.find((l) => l.id === id);
  const pickupLoc = findLoc(pickupLocationId);
  const dropoffLoc = findLoc(dropoffLocationId);

  const days = rentalDays({ pickupDate, dropoffDate, pickupTime, dropoffTime });
  const rentalSubtotal = days * dailyPrice;
  const pickupFee = pickupLoc?.deliveryFee ?? 0;
  const dropoffFee = dropoffLoc?.deliveryFee ?? 0;
  const total = days > 0 ? rentalSubtotal + pickupFee + dropoffFee : 0;

  // The user has entered a date range but it doesn't reach the 3-day minimum.
  const bothDatesChosen = Boolean(pickupDate && dropoffDate);
  const belowMinimum = bothDatesChosen && days > 0 && !meetsMinimumRental(days);

  const message = React.useMemo(() => {
    const lines = [`Hola, estoy interesado en rentar el ${vehicleTitle}.`];
    if (pickupDate) lines.push(`Recogida: ${formatDate(pickupDate)} ${pickupTime}`);
    if (dropoffDate) lines.push(`Devolución: ${formatDate(dropoffDate)} ${dropoffTime}`);
    if (pickupLoc) lines.push(`Lugar de recogida: ${pickupLoc.name}`);
    if (dropoffLoc) lines.push(`Lugar de devolución: ${dropoffLoc.name}`);
    if (days > 0) {
      lines.push("");
      lines.push(`${formatDailyPrice(dailyPrice)} x ${days} ${days === 1 ? "día" : "días"} = ${formatDailyPrice(rentalSubtotal)}`);
      if (pickupFee > 0) lines.push(`Entrega en ${pickupLoc?.name}: ${formatDailyPrice(pickupFee)}`);
      if (dropoffFee > 0) lines.push(`Devolución en ${dropoffLoc?.name}: ${formatDailyPrice(dropoffFee)}`);
      lines.push(`Total estimado: ${formatDailyPrice(total)}`);
    }
    lines.push("");
    lines.push("¿Está disponible?");
    return lines.join("\n");
  }, [
    vehicleTitle,
    pickupDate,
    dropoffDate,
    pickupTime,
    dropoffTime,
    pickupLoc,
    dropoffLoc,
    days,
    dailyPrice,
    rentalSubtotal,
    pickupFee,
    dropoffFee,
    total,
  ]);

  // Only enable the quote CTA when the selection meets the 3-day minimum
  // (or when no dates are chosen yet — the user can still open a general chat).
  const href =
    whatsappNumber && !belowMinimum ? buildWhatsAppUrl(whatsappNumber, message) : undefined;

  // Report a business event when the customer sends the quote. The generic
  // whatsapp_click is also captured by WhatsAppTracker; this adds the quote
  // detail (days, total, locations) to GA4 + dataLayer for conversions.
  const pushQuoteEvent = () => {
    trackEvent("quote_request", {
      vehicle: vehicleTitle,
      days,
      daily_price: dailyPrice,
      pickup_location: pickupLoc?.name,
      dropoff_location: dropoffLoc?.name,
      value: total,
    });
  };

  const locationLabel = (l: BookingLocation) => {
    if (!l.hasFee) return `${l.name} (gratis)`;
    return l.deliveryFee > 0
      ? `${l.name} (+${formatDailyPrice(l.deliveryFee)})`
      : `${l.name} (cargo adicional)`;
  };

  const fields = (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
        <TextField
          type="date"
          label="Recogida"
          size="small"
          value={pickupDate}
          onChange={(e) => setPickupDate(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
          sx={{ flex: "1 1 140px" }}
        />
        <TextField
          type="time"
          label="Hora"
          size="small"
          value={pickupTime}
          onChange={(e) => setPickupTime(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
          sx={{ flex: "1 1 100px" }}
        />
      </Box>
      <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
        <TextField
          type="date"
          label="Devolución"
          size="small"
          value={dropoffDate}
          onChange={(e) => setDropoffDate(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
          sx={{ flex: "1 1 140px" }}
        />
        <TextField
          type="time"
          label="Hora"
          size="small"
          value={dropoffTime}
          onChange={(e) => setDropoffTime(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
          sx={{ flex: "1 1 100px" }}
        />
      </Box>
      {hasLocations && (
        <>
          <TextField
            select
            label="Lugar de recogida"
            size="small"
            fullWidth
            value={pickupLocationId}
            onChange={(e) => setPickupLocationId(e.target.value)}
          >
            {locations.map((l) => (
              <MenuItem key={l.id} value={l.id}>
                {locationLabel(l)}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Lugar de devolución"
            size="small"
            fullWidth
            value={dropoffLocationId}
            onChange={(e) => setDropoffLocationId(e.target.value)}
          >
            {locations.map((l) => (
              <MenuItem key={l.id} value={l.id}>
                {locationLabel(l)}
              </MenuItem>
            ))}
          </TextField>
        </>
      )}
    </Box>
  );

  const summary = (
    <>
      {belowMinimum && (
        <Alert severity="warning" sx={{ mt: 2 }}>
          La renta mínima permitida es de {MIN_RENTAL_DAYS} días. Por favor, selecciona una fecha
          de devolución que complete al menos {MIN_RENTAL_DAYS} días de renta.
        </Alert>
      )}
      {days > 0 && (
        <Box sx={{ mt: 2 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              {formatDailyPrice(dailyPrice)} x {days} {days === 1 ? "día" : "días"}
            </Typography>
            <Typography variant="body2">{formatDailyPrice(rentalSubtotal)}</Typography>
          </Box>
          {pickupLoc?.hasFee && (
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
              <Typography variant="body2" color="text.secondary">
                Entrega · {pickupLoc.name}
              </Typography>
              <Typography variant="body2">
                {pickupFee > 0 ? formatDailyPrice(pickupFee) : "Cargo adicional"}
              </Typography>
            </Box>
          )}
          {dropoffLoc?.hasFee && (
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
              <Typography variant="body2" color="text.secondary">
                Devolución · {dropoffLoc.name}
              </Typography>
              <Typography variant="body2">
                {dropoffFee > 0 ? formatDailyPrice(dropoffFee) : "Cargo adicional"}
              </Typography>
            </Box>
          )}
          <Divider sx={{ my: 1 }} />
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography sx={{ fontWeight: 700 }}>Total estimado</Typography>
            <Typography sx={{ fontWeight: 700 }}>{formatDailyPrice(total)}</Typography>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.75 }}>
            Rentas antes de las 5:00 p. m. se cobran como día completo.
          </Typography>
        </Box>
      )}
    </>
  );

  const cta = (
    <Button
      component="a"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      variant="contained"
      size="large"
      fullWidth
      startIcon={<WhatsAppIcon />}
      data-wa-source="vehicle"
      data-wa-context={vehicleTitle}
      disabled={!href}
      onClick={pushQuoteEvent}
      sx={{ mt: 2 }}
    >
      Reservar por WhatsApp
    </Button>
  );

  // ---- Desktop: sticky card ----
  if (isDesktop) {
    return (
      <Box sx={{ position: "sticky", top: 96 }}>
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 3 }}>
          <Box sx={{ display: "flex", alignItems: "baseline", gap: 0.75, mb: 2 }}>
            <Typography variant="h4" sx={{ fontWeight: 800 }}>
              {formatDailyPrice(dailyPrice)}
            </Typography>
            <Typography variant="body1" color="text.secondary">
              / día
            </Typography>
          </Box>
          {fields}
          {summary}
          {cta}
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.5, textAlign: "center" }}>
            No se te cobrará nada por consultar disponibilidad.
          </Typography>
        </Paper>
      </Box>
    );
  }

  // ---- Mobile: fixed bottom bar + drawer ----
  return (
    <>
      <Paper
        elevation={8}
        sx={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: (t) => t.zIndex.appBar,
          px: 2,
          pt: 1.5,
          pb: "calc(12px + env(safe-area-inset-bottom))",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          borderTop: "1px solid",
          borderColor: "divider",
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          {days > 0 ? (
            <>
              <Typography sx={{ fontWeight: 800, lineHeight: 1.1 }}>
                {formatDailyPrice(total)}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {days} {days === 1 ? "día" : "días"} · {formatDailyPrice(dailyPrice)}/día
              </Typography>
            </>
          ) : (
            <Typography sx={{ fontWeight: 800, lineHeight: 1.1 }}>
              {formatDailyPrice(dailyPrice)}
              <Typography component="span" variant="body2" color="text.secondary">
                {" "}
                / día
              </Typography>
            </Typography>
          )}
        </Box>
        <Button variant="contained" size="large" onClick={() => setDrawerOpen(true)} sx={{ flexShrink: 0 }}>
          Reservar
        </Button>
      </Paper>

      <Drawer
        anchor="bottom"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        slotProps={{ paper: { sx: { borderTopLeftRadius: 16, borderTopRightRadius: 16 } } }}
      >
        <Box sx={{ p: 2.5, pb: "calc(20px + env(safe-area-inset-bottom))" }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 700 }}>
              Reservar {vehicleTitle}
            </Typography>
            <IconButton onClick={() => setDrawerOpen(false)} aria-label="Cerrar">
              <CloseRoundedIcon />
            </IconButton>
          </Box>
          {fields}
          {summary}
          {cta}
        </Box>
      </Drawer>
    </>
  );
}
