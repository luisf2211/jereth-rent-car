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
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { formatDailyPrice } from "@/features/vehicles/format";

interface Props {
  vehicleTitle: string;
  dailyPrice: number;
  whatsappNumber: string;
  /** Delivery location names to offer (from content). */
  locations: string[];
}

function daysBetween(pickup: string, dropoff: string): number {
  if (!pickup || !dropoff) return 0;
  const a = new Date(pickup).getTime();
  const b = new Date(dropoff).getTime();
  if (Number.isNaN(a) || Number.isNaN(b) || b <= a) return 0;
  return Math.round((b - a) / 86_400_000);
}

function formatDate(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}

/**
 * Booking module. Desktop: a sticky card in the right column. Mobile: a fixed
 * bottom bar that opens a drawer with the same fields. Dates/location are local
 * state (no availability engine yet); the CTA builds a WhatsApp message with
 * the chosen dates. Phone comes from CompanySettings (passed in).
 */
export default function VehicleBooking({ vehicleTitle, dailyPrice, whatsappNumber, locations }: Props) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const [pickup, setPickup] = React.useState("");
  const [dropoff, setDropoff] = React.useState("");
  const [location, setLocation] = React.useState("");
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const days = daysBetween(pickup, dropoff);
  const total = days > 0 ? days * dailyPrice : 0;

  const message = React.useMemo(() => {
    const lines = [`Hola, estoy interesado en rentar el ${vehicleTitle}.`];
    if (pickup) lines.push(`Fecha de recogida: ${formatDate(pickup)}`);
    if (dropoff) lines.push(`Fecha de devolución: ${formatDate(dropoff)}`);
    if (location) lines.push(`Lugar: ${location}`);
    lines.push("¿Está disponible?");
    return lines.join("\n");
  }, [vehicleTitle, pickup, dropoff, location]);

  const href = whatsappNumber ? buildWhatsAppUrl(whatsappNumber, message) : undefined;

  const fields = (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
        <TextField
          type="date"
          label="Recogida"
          size="small"
          value={pickup}
          onChange={(e) => setPickup(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
          sx={{ flex: "1 1 140px" }}
        />
        <TextField
          type="date"
          label="Devolución"
          size="small"
          value={dropoff}
          onChange={(e) => setDropoff(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
          sx={{ flex: "1 1 140px" }}
        />
      </Box>
      {locations.length > 0 && (
        <TextField
          select
          label="Lugar de entrega"
          size="small"
          fullWidth
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        >
          {locations.map((l) => (
            <MenuItem key={l} value={l}>
              {l}
            </MenuItem>
          ))}
        </TextField>
      )}
    </Box>
  );

  const summary = days > 0 && (
    <Box sx={{ mt: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
        <Typography variant="body2" color="text.secondary">
          {formatDailyPrice(dailyPrice)} x {days} {days === 1 ? "día" : "días"}
        </Typography>
        <Typography variant="body2">{formatDailyPrice(total)}</Typography>
      </Box>
      <Divider sx={{ my: 1 }} />
      <Box sx={{ display: "flex", justifyContent: "space-between" }}>
        <Typography sx={{ fontWeight: 700 }}>Total estimado</Typography>
        <Typography sx={{ fontWeight: 700 }}>{formatDailyPrice(total)}</Typography>
      </Box>
    </Box>
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
