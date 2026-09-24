"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import Alert from "@mui/material/Alert";
import Tooltip from "@mui/material/Tooltip";
import IconButton from "@mui/material/IconButton";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Autocomplete from "@mui/material/Autocomplete";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import FlightTakeoffRoundedIcon from "@mui/icons-material/FlightTakeoffRounded";
import {
  submitReservation,
  createAndSubmitWebReservation,
  uploadPaymentProof,
  uploadFlightItinerary,
} from "@/features/reservations/actions";
import { rentalDays, meetsMinimumRental, MIN_RENTAL_DAYS } from "@/utils/rental-days";
import {
  PAYMENT_METHODS,
  type PaymentMethod,
} from "@/lib/validations/reservation";
import { COUNTRIES } from "@/lib/countries";
import { AIRLINES } from "@/lib/airlines";
import type { ReservationFormData } from "@/features/reservations/data";
import { useI18n } from "@/i18n/LanguageProvider";
import type { TFunction } from "@/i18n/translate";

interface PaymentMethodsView {
  zelle: { name: string; email: string; phone: string } | null;
  paypal: { email: string; link: string } | null;
  cashapp: { tag: string } | null;
  instructions: string;
}

/** A delivery location option (from the existing DeliveryLocation table). */
export interface LocationOption {
  id: string;
  name: string;
  hasFee: boolean;
  deliveryFee: number;
  /** Airport locations pre-fill the flight arrival/return airport. */
  isAirport: boolean;
}

interface Props {
  reservation: ReservationFormData;
  paymentMethods: PaymentMethodsView;
  locations: LocationOption[];
  depositOptions: number[];
  /**
   * When true, this is the PUBLIC web flow rendered from /reservar/nuevo with
   * NO persisted reservation yet. On submit it CREATES the reservation (one
   * shot) and redirects to the permanent /reservar/<token> portal. When false
   * (default), it updates the existing reservation identified by its token
   * (manual admin links + correction flow).
   */
  createMode?: boolean;
}

function money(n: number) {
  return `US$${n.toLocaleString("en-US")}`;
}

/** Label for a location option, showing the fee when it applies. */
function locationLabel(t: TFunction, l: LocationOption): string {
  if (!l.hasFee) return t("booking.locationFree", { name: l.name });
  return l.deliveryFee > 0
    ? t("booking.locationPaid", { name: l.name, amount: money(l.deliveryFee) })
    : t("booking.locationExtra", { name: l.name });
}

/**
 * Map a server field-error key to a localized message. The server validates in
 * Spanish (Zod); for the customer-facing form we re-map by field name to the
 * dictionary so the message follows the active locale. Fields without a
 * specific key fall back to the server message.
 */
const FIELD_ERROR_KEY: Record<string, string> = {
  customerName: "validation.nameRequired",
  email: "validation.emailInvalid",
  phone: "validation.phoneRequired",
  country: "validation.countryRequired",
  idOrPassport: "validation.idRequired",
  driverLicense: "validation.licenseRequired",
  pickupDate: "validation.pickupDateRequired",
  pickupTime: "validation.pickupTimeRequired",
  dropoffDate: "validation.dropoffDateRequired",
  dropoffTime: "validation.dropoffTimeRequired",
  policyAccepted: "validation.policyRequired",
  paymentMethod: "validation.paymentMethodRequired",
  paymentProofUrl: "validation.proofRequired",
};

function localizeErrors(t: TFunction, errors: Record<string, string>): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [field, serverMsg] of Object.entries(errors)) {
    const key = FIELD_ERROR_KEY[field];
    out[field] = key ? t(key) : serverMsg;
  }
  return out;
}

/** Localized label for a payment method. */
function paymentMethodLabel(t: TFunction, m: PaymentMethod): string {
  switch (m) {
    case "zelle":
      return t("reservationForm.paymentMethodZelle");
    case "paypal":
      return t("reservationForm.paymentMethodPaypal");
    case "cashapp":
      return t("reservationForm.paymentMethodCashapp");
    default:
      return t("reservationForm.paymentMethodOther");
  }
}

export default function ReservationForm({
  reservation,
  paymentMethods,
  locations,
  depositOptions,
  createMode = false,
}: Props) {
  const router = useRouter();
  const { t } = useI18n();
  // Correction mode: the reservation was sent, admin asked for a fix, and the
  // customer is editing again. Detected by the incoming status.
  const isCorrection = reservation.status === "needs_fix";

  const [values, setValues] = React.useState({
    customerName: reservation.customerName,
    email: reservation.email,
    phone: reservation.phone,
    country: reservation.country,
    idOrPassport: reservation.idOrPassport,
    driverLicense: reservation.driverLicense,
    pickupDate: reservation.pickupDate,
    pickupTime: reservation.pickupTime || "10:00",
    dropoffDate: reservation.dropoffDate,
    dropoffTime: reservation.dropoffTime || "10:00",
    // Pre-select the previously chosen locations (correction mode).
    pickupLocationId: reservation.pickupLocationId || "",
    dropoffLocationId: reservation.dropoffLocationId || "",
    paymentMethod: "" as "" | PaymentMethod,
    paymentProofUrl: reservation.paymentProofUrl ?? "",
    // Special request (pre-fill on correction).
    specialRequest: reservation.specialRequest ?? "",
    // Flight info (pre-fill on correction).
    arrivalAirline: reservation.flight.arrivalAirline,
    arrivalFlightNumber: reservation.flight.arrivalFlightNumber,
    arrivalAirport: reservation.flight.arrivalAirport,
    arrivalDate: reservation.flight.arrivalDate,
    arrivalTime: reservation.flight.arrivalTime,
    arrivalItineraryUrl: reservation.flight.arrivalItineraryUrl,
    returnAirline: reservation.flight.returnAirline,
    returnFlightNumber: reservation.flight.returnFlightNumber,
    returnAirport: reservation.flight.returnAirport,
    returnDate: reservation.flight.returnDate,
    returnTime: reservation.flight.returnTime,
    returnItineraryUrl: reservation.flight.returnItineraryUrl,
  });
  // Whether the "special request" section is expanded.
  const [hasSpecialRequest, setHasSpecialRequest] = React.useState<boolean>(
    Boolean(reservation.specialRequest)
  );
  // Flight toggles.
  const [hasArrivalFlight, setHasArrivalFlight] = React.useState<boolean>(
    reservation.flight.hasArrivalFlight
  );
  const [hasReturnFlight, setHasReturnFlight] = React.useState<boolean>(
    reservation.flight.hasReturnFlight
  );
  const [uploadingItin, setUploadingItin] = React.useState<"arrival" | "return" | null>(null);
  // Mandatory acceptance of the reservation policy (required server-side). In
  // correction mode a prior acceptance is assumed so the customer isn't forced
  // to re-check on every fix.
  const [policyAccepted, setPolicyAccepted] = React.useState<boolean>(isCorrection);
  // When the rental pickup/dropoff is an airport, the flight airport is
  // pre-filled from it and shown read-only. These flags let the customer opt
  // into editing that airport manually ("Modificar datos de vuelo").
  // In correction mode, if a previously-saved airport differs from the current
  // airport location, start in manual mode so we don't overwrite their choice.
  const initPickupLoc = locations.find((l) => l.id === (reservation.pickupLocationId || "")) ?? null;
  const initDropoffLoc = locations.find((l) => l.id === (reservation.dropoffLocationId || "")) ?? null;
  const [editArrivalAirport, setEditArrivalAirport] = React.useState<boolean>(
    Boolean(
      initPickupLoc?.isAirport &&
        reservation.flight.arrivalAirport &&
        reservation.flight.arrivalAirport !== initPickupLoc.name
    )
  );
  const [editReturnAirport, setEditReturnAirport] = React.useState<boolean>(
    Boolean(
      initDropoffLoc?.isAirport &&
        reservation.flight.returnAirport &&
        reservation.flight.returnAirport !== initDropoffLoc.name
    )
  );
  const arrivalItinRef = React.useRef<HTMLInputElement>(null);
  const returnItinRef = React.useRef<HTMLInputElement>(null);
  // 0 = without deposit; otherwise the chosen amount. Pre-fill with the amount
  // already paid so a correction resubmit doesn't lose the deposit.
  const [depositChoice, setDepositChoice] = React.useState<number>(reservation.depositPaid || 0);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const setField = (k: string, v: string) => setValues((s) => ({ ...s, [k]: v }));

  // Smart calendar: when the pickup date changes, drop a now-invalid dropoff
  // (earlier than the new pickup) so the user re-picks a valid one; a still-
  // valid dropoff (>= pickup) is left untouched. The dropoff input also uses
  // min={pickupDate}, so the native picker opens on the pickup month (handles
  // month/year crossings) and blocks earlier dates.
  const handlePickupDateChange = (next: string) => {
    setValues((s) => ({
      ...s,
      pickupDate: next,
      dropoffDate: next && s.dropoffDate && s.dropoffDate < next ? "" : s.dropoffDate,
    }));
  };

  // Refs to each validatable field so we can scroll + focus the first invalid
  // one after a failed submit. Keyed by the schema field name so server
  // fieldErrors map 1:1. Works on mobile and desktop.
  const fieldRefs = React.useRef<Record<string, HTMLElement | null>>({});
  const registerField = (name: string) => (el: HTMLElement | null) => {
    fieldRefs.current[name] = el;
  };
  // Order used to decide which invalid field to scroll to first (top-down).
  const FIELD_ORDER = [
    "customerName",
    "email",
    "phone",
    "country",
    "idOrPassport",
    "driverLicense",
    "pickupDate",
    "pickupTime",
    "dropoffDate",
    "dropoffTime",
    "paymentMethod",
    "paymentProofUrl",
    "policyAccepted",
  ];
  const focusFirstError = (errors: Record<string, string>) => {
    const firstName = FIELD_ORDER.find((n) => errors[n]) ?? Object.keys(errors)[0];
    if (!firstName) return;
    const el = fieldRefs.current[firstName];
    if (!el) return;
    // Center the field in the viewport, then focus (focusable input inside).
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    const focusable =
      el.matches("input,textarea,select,button")
        ? (el as HTMLElement)
        : el.querySelector<HTMLElement>("input,textarea,select,button,[tabindex]");
    // Delay focus slightly so it doesn't fight the smooth scroll on mobile.
    window.setTimeout(() => focusable?.focus?.({ preventScroll: true }), 250);
  };

  const locOf = (id: string) => locations.find((l) => l.id === id) ?? null;
  const pickupLoc = locOf(values.pickupLocationId);
  const dropoffLoc = locOf(values.dropoffLocationId);
  const pickupFee = pickupLoc?.hasFee ? pickupLoc.deliveryFee : 0;
  const dropoffFee = dropoffLoc?.hasFee ? dropoffLoc.deliveryFee : 0;

  // Airport pre-fill: if the chosen rental pickup/dropoff is an airport, the
  // flight arrival/return airport is that same airport — so the customer never
  // re-enters what they already picked. The field is shown read-only until they
  // choose "Modificar datos de vuelo" (which sets editArrival/ReturnAirport).
  // Airline, flight number, date and time are ALWAYS entered manually.
  const pickupIsAirport = Boolean(pickupLoc?.isAirport);
  const dropoffIsAirport = Boolean(dropoffLoc?.isAirport);
  // Whether the airport field is currently locked to the rental location.
  const arrivalAirportLocked = pickupIsAirport && !editArrivalAirport;
  const returnAirportLocked = dropoffIsAirport && !editReturnAirport;

  // Keep the pre-filled airport value in sync with the selected airport
  // location while it stays locked. When the location is not an airport, or the
  // customer opted to modify, we leave the field alone (manual entry).
  React.useEffect(() => {
    if (hasArrivalFlight && arrivalAirportLocked && pickupLoc && values.arrivalAirport !== pickupLoc.name) {
      setField("arrivalAirport", pickupLoc.name);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasArrivalFlight, arrivalAirportLocked, pickupLoc?.name]);

  React.useEffect(() => {
    if (hasReturnFlight && returnAirportLocked && dropoffLoc && values.returnAirport !== dropoffLoc.name) {
      setField("returnAirport", dropoffLoc.name);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasReturnFlight, returnAirportLocked, dropoffLoc?.name]);

  // If the rental location stops being an airport (customer changes the pickup/
  // dropoff to a non-airport), drop the "modify" opt-in so the field returns to
  // a normal, freely-selectable airport input.
  React.useEffect(() => {
    if (!pickupIsAirport && editArrivalAirport) setEditArrivalAirport(false);
    if (!dropoffIsAirport && editReturnAirport) setEditReturnAirport(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickupIsAirport, dropoffIsAirport]);

  // Live pricing using the shared rental-days rules.
  const days = rentalDays({
    pickupDate: values.pickupDate,
    dropoffDate: values.dropoffDate,
    pickupTime: values.pickupTime,
    dropoffTime: values.dropoffTime,
  });
  const subtotalRent = days * reservation.dailyPrice;
  const total = subtotalRent + pickupFee + dropoffFee;
  const balanceDue = Math.max(total - depositChoice, 0);

  const bothDates = Boolean(values.pickupDate && values.dropoffDate);
  const belowMinimum = bothDates && days > 0 && !meetsMinimumRental(days);

  const availableMethods = PAYMENT_METHODS.filter((m) => {
    if (m === "zelle") return Boolean(paymentMethods.zelle);
    if (m === "paypal") return Boolean(paymentMethods.paypal);
    if (m === "cashapp") return Boolean(paymentMethods.cashapp);
    return true; // "otro" always allowed
  });

  const withDeposit = depositChoice > 0;

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await uploadPaymentProof(fd);
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
    if (res.ok) setField("paymentProofUrl", res.url);
    else setFormError(res.message);
  };

  const handleItinerary = async (
    which: "arrival" | "return",
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingItin(which);
    const fd = new FormData();
    fd.append("file", file);
    const res = await uploadFlightItinerary(fd);
    setUploadingItin(null);
    const ref = which === "arrival" ? arrivalItinRef : returnItinRef;
    if (ref.current) ref.current.value = "";
    if (res.ok) setField(which === "arrival" ? "arrivalItineraryUrl" : "returnItineraryUrl", res.url);
    else setFormError(res.message);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    setFieldErrors({});
    const payload = {
      ...values,
      depositChoice,
      paymentMethod: withDeposit ? values.paymentMethod || undefined : undefined,
      paymentProofUrl: withDeposit ? values.paymentProofUrl : "",
      specialRequest: hasSpecialRequest ? values.specialRequest : "",
      hasArrivalFlight,
      hasReturnFlight: hasArrivalFlight && hasReturnFlight,
      // Mandatory reservation-policy acceptance (validated server-side).
      policyAccepted,
    };

    // Create mode (public web flow): persist ONLY now, creating the reservation
    // in one shot, then go to the permanent tracking portal. Token mode:
    // update the existing reservation (manual links + correction).
    const res = createMode
      ? await createAndSubmitWebReservation({ ...payload, vehicleId: reservation.vehicleId })
      : await submitReservation(reservation.token, payload);

    if (res.ok && createMode) {
      const token = (res as { token?: string }).token;
      if (token) {
        // Redirect to the permanent portal so the customer sees the tracking
        // view with their new code/link (same UX as a submitted reservation).
        router.replace(`/reservar/${token}`);
        return;
      }
    }

    setSubmitting(false);
    if (res.ok) {
      setDone(true);
      return;
    }
    const rawErrors = res.fieldErrors ?? {};
    // Localize the customer-facing field messages to the active locale.
    const errors = localizeErrors(t, rawErrors);
    setFieldErrors(errors);
    // The top-level form error is shown as a localized generic message so the
    // customer never sees a raw Spanish server string in English mode.
    setFormError(res.message ? t("reservationForm.genericError") : null);
    // Scroll to + focus the first invalid field so the customer sees exactly
    // what to fix (works on mobile and desktop).
    if (Object.keys(errors).length > 0) focusFirstError(errors);
  };

  if (done) {
    return (
      <Card>
        <CardContent sx={{ textAlign: "center", py: { xs: 5, md: 6 }, px: { xs: 3, md: 5 } }}>
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 2 }}>
            {t("reservationForm.receivedTitle")}
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 1.5, lineHeight: 1.7 }}>
            {t("reservationForm.receivedBody", {
              withProof: withDeposit ? t("reservationForm.receivedProof") : "",
            })}
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 1.5, lineHeight: 1.7 }}>
            {t("reservationForm.receivedPending", {
              withPayment: withDeposit ? t("reservationForm.receivedPayment") : "",
            })}
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3, lineHeight: 1.7 }}>
            {t("reservationForm.receivedTimeframe")}
          </Typography>
          <Box
            sx={{
              display: "inline-block",
              px: 2.5,
              py: 1.25,
              borderRadius: 2,
              bgcolor: "grey.100",
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
              {t("reservationForm.reservationNumber")}
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: "0.02em" }}>
              {reservation.code}
            </Typography>
          </Box>
          <Box sx={{ mt: 3 }}>
            <Button variant="contained" onClick={() => window.location.reload()}>
              {t("reservationForm.viewStatus")}
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  }

  const err = (name: string) => Boolean(fieldErrors[name]);
  const help = (name: string) => fieldErrors[name];

  return (
    <Box component="form" onSubmit={onSubmit} noValidate>
      {formError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {formError}
        </Alert>
      )}

      {isCorrection && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <Typography sx={{ fontWeight: 700, mb: 0.5 }}>{t("reservationForm.fixTitle")}</Typography>
          {reservation.statusMessageVisible && reservation.statusMessage
            ? reservation.statusMessage
            : t("reservationForm.fixDefault")}
        </Alert>
      )}

      <Stack spacing={3}>
        {/* Vehicle summary */}
        <Card>
          <CardContent sx={{ display: "flex", gap: 2, alignItems: "center" }}>
            <Box sx={{ position: "relative", width: 96, height: 72, borderRadius: 2, overflow: "hidden", flexShrink: 0, bgcolor: "grey.100" }}>
              <Image src={reservation.vehicleImageUrl} alt={reservation.vehicleTitle} fill sizes="96px" style={{ objectFit: "cover" }} />
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {reservation.vehicleTitle}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {money(reservation.dailyPrice)} {t("common.perDay")}
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* Customer data */}
        <Card>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
              {t("reservationForm.sectionYourData")}
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label={t("reservationForm.fullName")} value={values.customerName} ref={registerField("customerName")}
                  onChange={(e) => setField("customerName", e.target.value)} error={err("customerName")} helperText={help("customerName")} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth type="email" label={t("reservationForm.email")} value={values.email} ref={registerField("email")}
                  onChange={(e) => setField("email", e.target.value)} error={err("email")} helperText={help("email")} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label={t("reservationForm.phone")} value={values.phone} ref={registerField("phone")}
                  onChange={(e) => setField("phone", e.target.value)} error={err("phone")} helperText={help("phone")} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Autocomplete
                  options={COUNTRIES}
                  value={values.country || null}
                  onChange={(_, v) => setField("country", v ?? "")}
                  autoHighlight
                  fullWidth
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label={t("reservationForm.country")}
                      ref={registerField("country")}
                      error={err("country")}
                      helperText={help("country")}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label={t("reservationForm.idOrPassport")} value={values.idOrPassport} ref={registerField("idOrPassport")}
                  onChange={(e) => setField("idOrPassport", e.target.value)} error={err("idOrPassport")} helperText={help("idOrPassport")} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label={t("reservationForm.driverLicense")} value={values.driverLicense} ref={registerField("driverLicense")}
                  onChange={(e) => setField("driverLicense", e.target.value)} error={err("driverLicense")} helperText={help("driverLicense")} />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Rental details */}
        <Card>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
              {t("reservationForm.sectionRentalDetails")}
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                <TextField fullWidth type="date" label={t("booking.pickupDate")} value={values.pickupDate} ref={registerField("pickupDate")}
                  onChange={(e) => handlePickupDateChange(e.target.value)} slotProps={{ inputLabel: { shrink: true } }}
                  error={err("pickupDate")} helperText={help("pickupDate")} />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField fullWidth type="time" label={t("booking.pickupTime")} value={values.pickupTime} ref={registerField("pickupTime")}
                  onChange={(e) => setField("pickupTime", e.target.value)} slotProps={{ inputLabel: { shrink: true } }}
                  error={err("pickupTime")} helperText={help("pickupTime")} />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField fullWidth type="date" label={t("booking.dropoffDate")} value={values.dropoffDate} ref={registerField("dropoffDate")}
                  onChange={(e) => setField("dropoffDate", e.target.value)}
                  slotProps={{ inputLabel: { shrink: true }, htmlInput: { min: values.pickupDate || undefined } }}
                  error={err("dropoffDate")} helperText={help("dropoffDate")} />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField fullWidth type="time" label={t("booking.dropoffTime")} value={values.dropoffTime} ref={registerField("dropoffTime")}
                  onChange={(e) => setField("dropoffTime", e.target.value)} slotProps={{ inputLabel: { shrink: true } }}
                  error={err("dropoffTime")} helperText={help("dropoffTime")} />
              </Grid>
              {/* Locations as selects from the existing DeliveryLocation list. */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  fullWidth
                  label={t("booking.pickupLocation")}
                  value={values.pickupLocationId}
                  onChange={(e) => setField("pickupLocationId", e.target.value)}
                >
                  <MenuItem value="">{t("reservationForm.unspecified")}</MenuItem>
                  {locations.map((l) => (
                    <MenuItem key={l.id} value={l.id}>
                      {locationLabel(t, l)}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  fullWidth
                  label={t("booking.dropoffLocation")}
                  value={values.dropoffLocationId}
                  onChange={(e) => setField("dropoffLocationId", e.target.value)}
                >
                  <MenuItem value="">{t("reservationForm.unspecified")}</MenuItem>
                  {locations.map((l) => (
                    <MenuItem key={l.id} value={l.id}>
                      {locationLabel(t, l)}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>

            {belowMinimum && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                {t("booking.minimumRentalFull", { days: MIN_RENTAL_DAYS })}
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Flight information (optional) */}
        <Card>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 0.5 }}>
              <FlightTakeoffRoundedIcon color="action" />
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {t("reservationForm.sectionFlight")}
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              {t("reservationForm.arrivesByPlane")}
            </Typography>
            <ToggleButtonGroup
              value={hasArrivalFlight ? "si" : "no"}
              exclusive
              onChange={(_, v) => {
                if (v === null) return;
                setHasArrivalFlight(v === "si");
                if (v === "no") setHasReturnFlight(false);
              }}
              sx={{ gap: 1, "& .MuiToggleButtonGroup-grouped": { borderRadius: "8px !important", border: "1px solid !important", borderColor: "divider !important" } }}
            >
              <ToggleButton value="no" sx={{ px: 3 }}>{t("common.no")}</ToggleButton>
              <ToggleButton value="si" sx={{ px: 3 }}>{t("common.yes")}</ToggleButton>
            </ToggleButtonGroup>

            {hasArrivalFlight && (
              <>
                <Grid container spacing={2} sx={{ mt: 0.5 }}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Autocomplete
                      options={AIRLINES}
                      value={values.arrivalAirline || null}
                      onChange={(_, v) => setField("arrivalAirline", v ?? "")}
                      autoHighlight
                      fullWidth
                      renderInput={(params) => <TextField {...params} label={t("reservationForm.airline")} />}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label={t("reservationForm.flightNumber")}
                      placeholder={t("reservationForm.flightNumberPlaceholderArrival")}
                      value={values.arrivalFlightNumber}
                      onChange={(e) => setField("arrivalFlightNumber", e.target.value)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    {arrivalAirportLocked ? (
                      <TextField
                        fullWidth
                        label={t("reservationForm.arrivalAirport")}
                        value={values.arrivalAirport || pickupLoc?.name || ""}
                        slotProps={{ input: { readOnly: true } }}
                        helperText={t("reservationForm.prefilledFromPickup")}
                      />
                    ) : (
                      <Autocomplete
                        freeSolo
                        options={locations.map((l) => l.name)}
                        value={values.arrivalAirport || ""}
                        onInputChange={(_, v) => setField("arrivalAirport", v ?? "")}
                        fullWidth
                        renderInput={(params) => <TextField {...params} label={t("reservationForm.arrivalAirport")} />}
                      />
                    )}
                    {pickupIsAirport && (
                      <Button
                        size="small"
                        color="secondary"
                        sx={{ mt: 0.5, textTransform: "none" }}
                        onClick={() => {
                          if (arrivalAirportLocked) {
                            // Switch to manual: keep the prefilled value as a starting point.
                            setEditArrivalAirport(true);
                          } else {
                            // Back to automatic: restore the airport from the pickup location.
                            setEditArrivalAirport(false);
                            if (pickupLoc) setField("arrivalAirport", pickupLoc.name);
                          }
                        }}
                      >
                        {arrivalAirportLocked ? t("reservationForm.modifyFlight") : t("reservationForm.usePickupAirport")}
                      </Button>
                    )}
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <TextField fullWidth type="date" label={t("reservationForm.arrivalDate")} value={values.arrivalDate}
                      onChange={(e) => setField("arrivalDate", e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <TextField fullWidth type="time" label={t("reservationForm.estimatedTime")} value={values.arrivalTime}
                      onChange={(e) => setField("arrivalTime", e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
                  </Grid>
                </Grid>
                <Box sx={{ mt: 2 }}>
                  <input ref={arrivalItinRef} type="file" accept="image/png,image/jpeg,image/webp,application/pdf" hidden onChange={(e) => handleItinerary("arrival", e)} />
                  <Button variant="outlined" color="secondary" size="small" onClick={() => arrivalItinRef.current?.click()} disabled={uploadingItin === "arrival"}>
                    {uploadingItin === "arrival" ? t("reservationForm.uploading") : values.arrivalItineraryUrl ? t("reservationForm.itineraryLoaded") : t("reservationForm.attachItinerary")}
                  </Button>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                    {t("reservationForm.itineraryHelp")}
                  </Typography>
                </Box>

                {/* Return flight */}
                <Box sx={{ mt: 2.5 }}>
                  <ToggleButtonGroup
                    value={hasReturnFlight ? "si" : "no"}
                    exclusive
                    onChange={(_, v) => {
                      if (v === null) return;
                      setHasReturnFlight(v === "si");
                    }}
                    size="small"
                    sx={{ gap: 1, "& .MuiToggleButtonGroup-grouped": { borderRadius: "8px !important", border: "1px solid !important", borderColor: "divider !important" } }}
                  >
                    <ToggleButton value="no" sx={{ px: 2 }}>{t("reservationForm.noReturnFlight")}</ToggleButton>
                    <ToggleButton value="si" sx={{ px: 2 }}>{t("reservationForm.addReturnFlight")}</ToggleButton>
                  </ToggleButtonGroup>
                </Box>

                {hasReturnFlight && (
                  <>
                    <Grid container spacing={2} sx={{ mt: 0.5 }}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Autocomplete
                          options={AIRLINES}
                          value={values.returnAirline || null}
                          onChange={(_, v) => setField("returnAirline", v ?? "")}
                          autoHighlight
                          fullWidth
                          renderInput={(params) => <TextField {...params} label={t("reservationForm.airlineReturn")} />}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          label={t("reservationForm.flightNumberReturn")}
                          placeholder={t("reservationForm.flightNumberPlaceholderReturn")}
                          value={values.returnFlightNumber}
                          onChange={(e) => setField("returnFlightNumber", e.target.value)}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        {returnAirportLocked ? (
                          <TextField
                            fullWidth
                            label={t("reservationForm.departureAirport")}
                            value={values.returnAirport || dropoffLoc?.name || ""}
                            slotProps={{ input: { readOnly: true } }}
                            helperText={t("reservationForm.prefilledFromDropoff")}
                          />
                        ) : (
                          <Autocomplete
                            freeSolo
                            options={locations.map((l) => l.name)}
                            value={values.returnAirport || ""}
                            onInputChange={(_, v) => setField("returnAirport", v ?? "")}
                            fullWidth
                            renderInput={(params) => <TextField {...params} label={t("reservationForm.departureAirport")} />}
                          />
                        )}
                        {dropoffIsAirport && (
                          <Button
                            size="small"
                            color="secondary"
                            sx={{ mt: 0.5, textTransform: "none" }}
                            onClick={() => {
                              if (returnAirportLocked) {
                                setEditReturnAirport(true);
                              } else {
                                setEditReturnAirport(false);
                                if (dropoffLoc) setField("returnAirport", dropoffLoc.name);
                              }
                            }}
                          >
                            {returnAirportLocked ? t("reservationForm.modifyFlight") : t("reservationForm.useDropoffAirport")}
                          </Button>
                        )}
                      </Grid>
                      <Grid size={{ xs: 6, sm: 3 }}>
                        <TextField fullWidth type="date" label={t("reservationForm.date")} value={values.returnDate}
                          onChange={(e) => setField("returnDate", e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
                      </Grid>
                      <Grid size={{ xs: 6, sm: 3 }}>
                        <TextField fullWidth type="time" label={t("reservationForm.time")} value={values.returnTime}
                          onChange={(e) => setField("returnTime", e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
                      </Grid>
                    </Grid>
                    <Box sx={{ mt: 2 }}>
                      <input ref={returnItinRef} type="file" accept="image/png,image/jpeg,image/webp,application/pdf" hidden onChange={(e) => handleItinerary("return", e)} />
                      <Button variant="outlined" color="secondary" size="small" onClick={() => returnItinRef.current?.click()} disabled={uploadingItin === "return"}>
                        {uploadingItin === "return" ? t("reservationForm.uploading") : values.returnItineraryUrl ? t("reservationForm.itineraryLoaded") : t("reservationForm.attachReturnItinerary")}
                      </Button>
                    </Box>
                  </>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Special request (optional) */}
        <Card>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 0.5 }}>
              {t("reservationForm.specialRequestTitle")}
            </Typography>
            <ToggleButtonGroup
              value={hasSpecialRequest ? "si" : "no"}
              exclusive
              onChange={(_, v) => {
                if (v === null) return;
                const yes = v === "si";
                setHasSpecialRequest(yes);
                if (!yes) setField("specialRequest", "");
              }}
              sx={{ mt: 1, gap: 1, "& .MuiToggleButtonGroup-grouped": { borderRadius: "8px !important", border: "1px solid !important", borderColor: "divider !important" } }}
            >
              <ToggleButton value="no" sx={{ px: 3 }}>{t("common.no")}</ToggleButton>
              <ToggleButton value="si" sx={{ px: 3 }}>{t("common.yes")}</ToggleButton>
            </ToggleButtonGroup>

            {hasSpecialRequest && (
              <Box sx={{ mt: 2 }}>
                <TextField
                  fullWidth
                  label={t("reservationForm.specialRequestLabel")}
                  value={values.specialRequest}
                  onChange={(e) => setField("specialRequest", e.target.value)}
                  multiline
                  minRows={3}
                  placeholder={t("reservationForm.specialRequestPlaceholder")}
                />
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.75 }}>
                  {t("reservationForm.specialRequestNote")}
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Deposit choice */}
        <Card>
          <CardContent>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 0.5 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {t("reservationForm.depositTitle")}
              </Typography>
              <Tooltip title={t("reservationForm.depositInfo")} enterTouchDelay={0} leaveTouchDelay={6000} arrow>
                <IconButton size="small" aria-label={t("reservationForm.depositInfoAria")}>
                  <InfoOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {t("reservationForm.depositIntro")}
            </Typography>

            <ToggleButtonGroup
              value={depositChoice}
              exclusive
              onChange={(_, v) => {
                if (v !== null) setDepositChoice(v as number);
              }}
              sx={{ flexWrap: "wrap", gap: 1, "& .MuiToggleButtonGroup-grouped": { borderRadius: "8px !important", border: "1px solid !important", borderColor: "divider !important" } }}
            >
              {depositOptions.map((amount) => (
                <ToggleButton key={amount} value={amount} sx={{ px: 2.5 }}>
                  {t("reservationForm.reserveWith", { amount: money(amount) })}
                </ToggleButton>
              ))}
              <ToggleButton value={0} sx={{ px: 2.5 }}>
                {t("reservationForm.continueWithoutDeposit")}
              </ToggleButton>
            </ToggleButtonGroup>
          </CardContent>
        </Card>

        {/* Payment (only when a deposit is chosen and there are enabled methods) */}
        {withDeposit && availableMethods.length > 0 && (
          <Card>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                {t("reservationForm.paymentTitle", { amount: money(depositChoice) })}
              </Typography>

              {paymentMethods.instructions && (
                <Alert severity="info" sx={{ mb: 2 }}>
                  {paymentMethods.instructions}
                </Alert>
              )}

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    select
                    fullWidth
                    label={t("reservationForm.paymentMethod")}
                    value={values.paymentMethod}
                    ref={registerField("paymentMethod")}
                    onChange={(e) => setField("paymentMethod", e.target.value)}
                    error={err("paymentMethod")}
                    helperText={help("paymentMethod")}
                  >
                    {availableMethods.map((m) => (
                      <MenuItem key={m} value={m}>
                        {paymentMethodLabel(t, m)}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </Grid>

              {values.paymentMethod === "zelle" && paymentMethods.zelle && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Zelle: {paymentMethods.zelle.name}
                  {paymentMethods.zelle.email ? ` · ${paymentMethods.zelle.email}` : ""}
                  {paymentMethods.zelle.phone ? ` · ${paymentMethods.zelle.phone}` : ""}
                </Alert>
              )}
              {values.paymentMethod === "paypal" && paymentMethods.paypal && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  PayPal: {paymentMethods.paypal.email}
                  {paymentMethods.paypal.link ? ` · ${paymentMethods.paypal.link}` : ""}
                </Alert>
              )}
              {values.paymentMethod === "cashapp" && paymentMethods.cashapp && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  Cash App: {paymentMethods.cashapp.tag}
                </Alert>
              )}

              <Box sx={{ mt: 2 }} ref={registerField("paymentProofUrl")}>
                <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={handleFile} />
                <Button variant="outlined" color="secondary" onClick={() => fileRef.current?.click()} disabled={uploading}>
                  {uploading ? t("reservationForm.uploading") : values.paymentProofUrl ? t("reservationForm.proofLoaded") : t("reservationForm.uploadProof")}
                </Button>
                {err("paymentProofUrl") && (
                  <Typography variant="caption" color="error" sx={{ display: "block", mt: 0.5 }}>
                    {help("paymentProofUrl")}
                  </Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        )}

        {/* Price breakdown */}
        {days > 0 && (
          <Card>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1.5 }}>
                {t("reservationForm.summary")}
              </Typography>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                <Typography variant="body2" color="text.secondary">
                  {t(days === 1 ? "reservationForm.subtotalDaysOne" : "reservationForm.subtotalDaysMany", {
                    price: money(reservation.dailyPrice),
                    days,
                  })}
                </Typography>
                <Typography variant="body2">{money(subtotalRent)}</Typography>
              </Box>
              {pickupFee > 0 && (
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">{t("booking.pickupFee")}</Typography>
                  <Typography variant="body2">{money(pickupFee)}</Typography>
                </Box>
              )}
              {dropoffFee > 0 && (
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">{t("booking.dropoffFee")}</Typography>
                  <Typography variant="body2">{money(dropoffFee)}</Typography>
                </Box>
              )}
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography sx={{ fontWeight: 700 }}>{t("reservationForm.total")}</Typography>
                <Typography sx={{ fontWeight: 700 }}>{money(total)}</Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.75 }}>
                <Typography variant="body2" color="text.secondary">{t("reservationForm.reservedAmount")}</Typography>
                <Typography variant="body2">{money(depositChoice)}</Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.5 }}>
                <Typography sx={{ fontWeight: 700 }}>{t("reservationForm.balanceDue")}</Typography>
                <Typography sx={{ fontWeight: 700 }}>{money(balanceDue)}</Typography>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                {t("reservationForm.depositNote")}
              </Typography>
            </CardContent>
          </Card>
        )}

        {/* Mandatory reservation-policy acceptance */}
        <Card
          ref={registerField("policyAccepted")}
          variant="outlined"
          sx={{
            borderColor: err("policyAccepted") ? "error.main" : "divider",
            borderWidth: err("policyAccepted") ? 2 : 1,
          }}
        >
          <CardContent>
            <FormControlLabel
              sx={{ alignItems: "flex-start", m: 0 }}
              control={
                <Checkbox
                  checked={policyAccepted}
                  onChange={(e) => {
                    setPolicyAccepted(e.target.checked);
                    if (e.target.checked) {
                      // Clear the error as soon as the customer accepts.
                      setFieldErrors((prev) => {
                        const next = { ...prev };
                        delete next.policyAccepted;
                        return next;
                      });
                    }
                  }}
                  sx={{ pt: 0.25 }}
                />
              }
              label={
                <Typography variant="body2" color="text.secondary">
                  {t("reservationForm.policyAccept")}
                </Typography>
              }
            />
            {err("policyAccepted") && (
              <Typography variant="caption" color="error" sx={{ display: "block", mt: 0.5, ml: 4 }}>
                {help("policyAccepted")}
              </Typography>
            )}
          </CardContent>
        </Card>

        <Button type="submit" variant="contained" size="large" disabled={submitting || belowMinimum}>
          {submitting
            ? t("common.sending")
            : isCorrection
              ? t("reservationForm.resubmit")
              : t("reservationForm.submit")}
        </Button>
      </Stack>
    </Box>
  );
}
