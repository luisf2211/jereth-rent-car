"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
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
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import Alert from "@mui/material/Alert";
import { buildWhatsAppUrl } from "@/lib/whatsapp";
import { formatDailyPrice } from "@/features/vehicles/format";
import { rentalDays, meetsMinimumRental, MIN_RENTAL_DAYS } from "@/utils/rental-days";
import { trackEvent } from "@/lib/analytics";
import { useI18n } from "@/i18n/LanguageProvider";
import TimeField12h from "@/components/public/reservation/TimeField12h";


/** Delivery location option. `hasFee` marks a paid location; `deliveryFee`
 *  is the amount (may be 0 = "Cargo adicional" label without a price). */
export interface BookingLocation {
  id: string;
  name: string;
  hasFee: boolean;
  deliveryFee: number;
}

interface Props {
  /** Real vehicle id — used to start the digital reservation with the same car. */
  vehicleId: string;
  vehicleTitle: string;
  dailyPrice: number;
  whatsappNumber: string;
  /** Delivery/pickup locations with their fees (from the delivery module). */
  locations: BookingLocation[];
  /** Reservation settings switch. When true the CTA becomes the digital flow
   *  ("Reservar ahora"); when false it stays the current WhatsApp quote. */
  digitalEnabled: boolean;
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
export default function VehicleBooking({ vehicleId, vehicleTitle, dailyPrice, whatsappNumber, locations, digitalEnabled }: Props) {
  const theme = useTheme();
  const router = useRouter();
  const { t } = useI18n();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const [pickupDate, setPickupDate] = React.useState("");
  const [dropoffDate, setDropoffDate] = React.useState("");
  const [pickupTime, setPickupTime] = React.useState(DEFAULT_PICKUP_TIME);
  const [dropoffTime, setDropoffTime] = React.useState(DEFAULT_DROPOFF_TIME);
  const [pickupLocationId, setPickupLocationId] = React.useState("");
  const [dropoffLocationId, setDropoffLocationId] = React.useState("");
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  // Digital-flow submit state (only used when digitalEnabled).
  const [starting, setStarting] = React.useState(false);
  const [startError, setStartError] = React.useState<string | null>(null);

  const hasLocations = locations.length > 0;
  const findLoc = (id: string) => locations.find((l) => l.id === id);
  const pickupLoc = findLoc(pickupLocationId);
  const dropoffLoc = findLoc(dropoffLocationId);

  // Smart calendar: when the pickup date changes, drop a now-invalid dropoff
  // (one that is earlier than the new pickup) so the user re-picks a valid
  // date. A dropoff that is still >= pickup is kept untouched. The dropoff
  // input also gets min={pickupDate}, so the native picker opens on the pickup
  // month (Oct → Oct, Nov → Nov, crossing years too) and blocks earlier dates.
  const handlePickupDateChange = (next: string) => {
    setPickupDate(next);
    if (next && dropoffDate && dropoffDate < next) {
      setDropoffDate("");
    }
  };

  const days = rentalDays({ pickupDate, dropoffDate, pickupTime, dropoffTime });
  const rentalSubtotal = days * dailyPrice;
  const pickupFee = pickupLoc?.deliveryFee ?? 0;
  const dropoffFee = dropoffLoc?.deliveryFee ?? 0;
  const total = days > 0 ? rentalSubtotal + pickupFee + dropoffFee : 0;

  // The user has entered a date range but it doesn't reach the 3-day minimum.
  const bothDatesChosen = Boolean(pickupDate && dropoffDate);
  const belowMinimum = bothDatesChosen && days > 0 && !meetsMinimumRental(days);

  const message = React.useMemo(() => {
    const lines = [t("booking.msgInterested", { title: vehicleTitle })];
    if (pickupDate) lines.push(t("booking.msgPickup", { date: formatDate(pickupDate), time: pickupTime }));
    if (dropoffDate) lines.push(t("booking.msgDropoff", { date: formatDate(dropoffDate), time: dropoffTime }));
    if (pickupLoc) lines.push(t("booking.msgPickupLoc", { name: pickupLoc.name }));
    if (dropoffLoc) lines.push(t("booking.msgDropoffLoc", { name: dropoffLoc.name }));
    if (days > 0) {
      lines.push("");
      lines.push(
        t(days === 1 ? "booking.msgLineOne" : "booking.msgLineMany", {
          price: formatDailyPrice(dailyPrice),
          days,
          subtotal: formatDailyPrice(rentalSubtotal),
        }),
      );
      if (pickupFee > 0)
        lines.push(t("booking.msgDeliveryAt", { name: pickupLoc?.name ?? "", amount: formatDailyPrice(pickupFee) }));
      if (dropoffFee > 0)
        lines.push(t("booking.msgDropoffAt", { name: dropoffLoc?.name ?? "", amount: formatDailyPrice(dropoffFee) }));
      lines.push(t("booking.msgTotal", { total: formatDailyPrice(total) }));
    }
    lines.push("");
    lines.push(t("booking.msgAvailable"));
    return lines.join("\n");
  }, [
    t,
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

  // Digital flow: open the reservation FORM (no DB write yet) carrying the
  // current selection as query params. The reservation is created ONLY when
  // the customer submits the form (create mode), so abandoning it leaves no
  // "ghost" reservation. The server still recomputes price/days/fees on submit.
  const startDigital = () => {
    if (starting) return;
    setStarting(true);
    setStartError(null);
    trackEvent("reservation_start", {
      vehicle: vehicleTitle,
      days,
      daily_price: dailyPrice,
      value: total,
    });
    const params = new URLSearchParams({ vehicleId });
    if (pickupDate) params.set("pickupDate", pickupDate);
    if (pickupTime) params.set("pickupTime", pickupTime);
    if (dropoffDate) params.set("dropoffDate", dropoffDate);
    if (dropoffTime) params.set("dropoffTime", dropoffTime);
    if (pickupLocationId) params.set("pickupLocationId", pickupLocationId);
    if (dropoffLocationId) params.set("dropoffLocationId", dropoffLocationId);
    router.push(`/reservar/nuevo?${params.toString()}`);
  };

  const locationLabel = (l: BookingLocation) => {
    if (!l.hasFee) return t("booking.locationFree", { name: l.name });
    return l.deliveryFee > 0
      ? t("booking.locationPaid", { name: l.name, amount: formatDailyPrice(l.deliveryFee) })
      : t("booking.locationExtra", { name: l.name });
  };

  const fields = (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
      <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
        <TextField
          type="date"
          label={t("booking.pickupShort")}
          size="small"
          value={pickupDate}
          onChange={(e) => handlePickupDateChange(e.target.value)}
          slotProps={{ inputLabel: { shrink: true } }}
          sx={{ flex: "1 1 140px" }}
        />
        <Box sx={{ flex: "1 1 100%" }}>
          <TimeField12h
            label={t("booking.timeShort")}
            value={pickupTime}
            onChange={(v) => setPickupTime(v)}
          />
        </Box>
      </Box>
      <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
        <TextField
          type="date"
          label={t("booking.dropoffShort")}
          size="small"
          value={dropoffDate}
          onChange={(e) => setDropoffDate(e.target.value)}
          slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: pickupDate || undefined } }}
          sx={{ flex: "1 1 140px" }}
        />
        <Box sx={{ flex: "1 1 100%" }}>
          <TimeField12h
            label={t("booking.timeShort")}
            value={dropoffTime}
            onChange={(v) => setDropoffTime(v)}
          />
        </Box>
      </Box>
      {hasLocations && (
        <>
          <TextField
            select
            label={t("booking.pickupLocation")}
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
            label={t("booking.dropoffLocation")}
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
          {t("booking.minimumRentalFull", { days: MIN_RENTAL_DAYS })}
        </Alert>
      )}
      {days > 0 && (
        <Box sx={{ mt: 2 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
            <Typography variant="body2" color="text.secondary">
              {t(days === 1 ? "booking.priceTimesDaysOne" : "booking.priceTimesDaysMany", {
                price: formatDailyPrice(dailyPrice),
                days,
              })}
            </Typography>
            <Typography variant="body2">{formatDailyPrice(rentalSubtotal)}</Typography>
          </Box>
          {pickupLoc?.hasFee && (
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
              <Typography variant="body2" color="text.secondary">
                {t("booking.deliveryLine", { name: pickupLoc.name })}
              </Typography>
              <Typography variant="body2">
                {pickupFee > 0 ? formatDailyPrice(pickupFee) : t("booking.extraCharge")}
              </Typography>
            </Box>
          )}
          {dropoffLoc?.hasFee && (
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
              <Typography variant="body2" color="text.secondary">
                {t("booking.dropoffLine", { name: dropoffLoc.name })}
              </Typography>
              <Typography variant="body2">
                {dropoffFee > 0 ? formatDailyPrice(dropoffFee) : t("booking.extraCharge")}
              </Typography>
            </Box>
          )}
          <Divider sx={{ my: 1 }} />
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography sx={{ fontWeight: 700 }}>{t("booking.totalEstimated")}</Typography>
            <Typography sx={{ fontWeight: 700 }}>{formatDailyPrice(total)}</Typography>
          </Box>
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.75 }}>
            {t("booking.beforeFivePm")}
          </Typography>
        </Box>
      )}
    </>
  );

  // WhatsApp CTA (unchanged) — used when digital reservations are OFF.
  const whatsappCta = (
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
      {t("booking.reserveByWhatsapp")}
    </Button>
  );

  // Digital CTA — used when the reservation switch is ON. Disabled while the
  // selection is below the 3-day minimum (same guard as the WhatsApp quote)
  // or while the reservation is being created.
  const digitalCta = (
    <>
      <Button
        type="button"
        variant="contained"
        size="large"
        fullWidth
        endIcon={<ArrowForwardRoundedIcon />}
        disabled={belowMinimum || starting}
        onClick={startDigital}
        sx={{ mt: 2 }}
      >
        {starting ? t("common.starting") : t("booking.reserveNow")}
      </Button>
      {startError && (
        <Alert severity="error" sx={{ mt: 1.5 }}>
          {startError}
        </Alert>
      )}
    </>
  );

  const cta = digitalEnabled ? digitalCta : whatsappCta;

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
              {t("common.perDay")}
            </Typography>
          </Box>
          {fields}
          {summary}
          {cta}
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1.5, textAlign: "center" }}>
            {t("booking.noChargeToCheck")}
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
                {t(days === 1 ? "booking.dayWithPrice" : "booking.daysWithPrice", {
                  days,
                  price: formatDailyPrice(dailyPrice),
                })}
              </Typography>
            </>
          ) : (
            <Typography sx={{ fontWeight: 800, lineHeight: 1.1 }}>
              {formatDailyPrice(dailyPrice)}
              <Typography component="span" variant="body2" color="text.secondary">
                {" "}
                {t("common.perDay")}
              </Typography>
            </Typography>
          )}
        </Box>
        <Button variant="contained" size="large" onClick={() => setDrawerOpen(true)} sx={{ flexShrink: 0 }}>
          {t("booking.reserve")}
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
              {t("booking.reserveVehicle", { title: vehicleTitle })}
            </Typography>
            <IconButton onClick={() => setDrawerOpen(false)} aria-label={t("common.close")}>
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
