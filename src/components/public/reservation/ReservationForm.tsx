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
  PAYMENT_METHOD_LABELS,
  type PaymentMethod,
} from "@/lib/validations/reservation";
import { COUNTRIES } from "@/lib/countries";
import { AIRLINES } from "@/lib/airlines";
import type { ReservationFormData } from "@/features/reservations/data";

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

const DEPOSIT_INFO =
  "El depósito no es obligatorio para enviar tu solicitud. Realizar un depósito permite asegurar tu reserva. En caso de que el vehículo reservado no esté disponible, JERETH RENT CAR podrá proporcionar un vehículo similar o de categoría superior, sujeto a disponibilidad y manteniendo las condiciones acordadas.";

function money(n: number) {
  return `US$${n.toLocaleString("en-US")}`;
}

/** Label for a location option, showing the fee when it applies. */
function locationLabel(l: LocationOption): string {
  if (!l.hasFee) return `${l.name} (gratis)`;
  return l.deliveryFee > 0 ? `${l.name} (+${money(l.deliveryFee)})` : `${l.name} (cargo adicional)`;
}

export default function ReservationForm({
  reservation,
  paymentMethods,
  locations,
  depositOptions,
  createMode = false,
}: Props) {
  const router = useRouter();
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
    const errors = res.fieldErrors ?? {};
    setFieldErrors(errors);
    setFormError(res.message);
    // Scroll to + focus the first invalid field so the customer sees exactly
    // what to fix (works on mobile and desktop).
    if (Object.keys(errors).length > 0) focusFirstError(errors);
  };

  if (done) {
    return (
      <Card>
        <CardContent sx={{ textAlign: "center", py: { xs: 5, md: 6 }, px: { xs: 3, md: 5 } }}>
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 2 }}>
            ¡Solicitud de reserva recibida!
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 1.5, lineHeight: 1.7 }}>
            Hemos recibido correctamente tus datos{withDeposit ? " y tu comprobante de pago" : ""}.
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 1.5, lineHeight: 1.7 }}>
            Tu reserva se encuentra <strong>pendiente de verificación</strong>. Nuestro equipo
            revisará la información{withDeposit ? " y el pago enviado" : ""}.
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3, lineHeight: 1.7 }}>
            Recibirás una respuesta dentro de un plazo de 0 a 24 horas. Puedes volver a abrir este
            mismo enlace en cualquier momento para consultar el estado de tu reserva.
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
              Número de reserva
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: "0.02em" }}>
              {reservation.code}
            </Typography>
          </Box>
          <Box sx={{ mt: 3 }}>
            <Button variant="contained" onClick={() => window.location.reload()}>
              Ver estado de mi reserva
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
          <Typography sx={{ fontWeight: 700, mb: 0.5 }}>Corrige tu información</Typography>
          {reservation.statusMessageVisible && reservation.statusMessage
            ? reservation.statusMessage
            : "Revisa y actualiza los datos de tu reserva, luego vuelve a enviarla."}
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
                {money(reservation.dailyPrice)} / día
              </Typography>
            </Box>
          </CardContent>
        </Card>

        {/* Customer data */}
        <Card>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
              Tus datos
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="Nombre completo" value={values.customerName} ref={registerField("customerName")}
                  onChange={(e) => setField("customerName", e.target.value)} error={err("customerName")} helperText={help("customerName")} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth type="email" label="Correo electrónico" value={values.email} ref={registerField("email")}
                  onChange={(e) => setField("email", e.target.value)} error={err("email")} helperText={help("email")} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="WhatsApp / Teléfono" value={values.phone} ref={registerField("phone")}
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
                      label="País"
                      ref={registerField("country")}
                      error={err("country")}
                      helperText={help("country")}
                    />
                  )}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="Identificación o pasaporte" value={values.idOrPassport} ref={registerField("idOrPassport")}
                  onChange={(e) => setField("idOrPassport", e.target.value)} error={err("idOrPassport")} helperText={help("idOrPassport")} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="Licencia de conducir" value={values.driverLicense} ref={registerField("driverLicense")}
                  onChange={(e) => setField("driverLicense", e.target.value)} error={err("driverLicense")} helperText={help("driverLicense")} />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Rental details */}
        <Card>
          <CardContent>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
              Detalles de la renta
            </Typography>
            <Grid container spacing={2}>
              <Grid size={{ xs: 6 }}>
                <TextField fullWidth type="date" label="Fecha de recogida" value={values.pickupDate} ref={registerField("pickupDate")}
                  onChange={(e) => setField("pickupDate", e.target.value)} slotProps={{ inputLabel: { shrink: true } }}
                  error={err("pickupDate")} helperText={help("pickupDate")} />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField fullWidth type="time" label="Hora de recogida" value={values.pickupTime} ref={registerField("pickupTime")}
                  onChange={(e) => setField("pickupTime", e.target.value)} slotProps={{ inputLabel: { shrink: true } }}
                  error={err("pickupTime")} helperText={help("pickupTime")} />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField fullWidth type="date" label="Fecha de devolución" value={values.dropoffDate} ref={registerField("dropoffDate")}
                  onChange={(e) => setField("dropoffDate", e.target.value)} slotProps={{ inputLabel: { shrink: true } }}
                  error={err("dropoffDate")} helperText={help("dropoffDate")} />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField fullWidth type="time" label="Hora de devolución" value={values.dropoffTime} ref={registerField("dropoffTime")}
                  onChange={(e) => setField("dropoffTime", e.target.value)} slotProps={{ inputLabel: { shrink: true } }}
                  error={err("dropoffTime")} helperText={help("dropoffTime")} />
              </Grid>
              {/* Locations as selects from the existing DeliveryLocation list. */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  fullWidth
                  label="Lugar de recogida"
                  value={values.pickupLocationId}
                  onChange={(e) => setField("pickupLocationId", e.target.value)}
                >
                  <MenuItem value="">Sin especificar</MenuItem>
                  {locations.map((l) => (
                    <MenuItem key={l.id} value={l.id}>
                      {locationLabel(l)}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  fullWidth
                  label="Lugar de devolución"
                  value={values.dropoffLocationId}
                  onChange={(e) => setField("dropoffLocationId", e.target.value)}
                >
                  <MenuItem value="">Sin especificar</MenuItem>
                  {locations.map((l) => (
                    <MenuItem key={l.id} value={l.id}>
                      {locationLabel(l)}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
            </Grid>

            {belowMinimum && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                La renta mínima permitida es de {MIN_RENTAL_DAYS} días. Por favor, selecciona una fecha
                de devolución que complete al menos {MIN_RENTAL_DAYS} días de renta.
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
                Información de vuelo
              </Typography>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              ¿Llegas en avión?
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
              <ToggleButton value="no" sx={{ px: 3 }}>No</ToggleButton>
              <ToggleButton value="si" sx={{ px: 3 }}>Sí</ToggleButton>
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
                      renderInput={(params) => <TextField {...params} label="Aerolínea" />}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                      fullWidth
                      label="Número de vuelo"
                      placeholder="Ej.: AA 987, B6 244"
                      value={values.arrivalFlightNumber}
                      onChange={(e) => setField("arrivalFlightNumber", e.target.value)}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    {arrivalAirportLocked ? (
                      <TextField
                        fullWidth
                        label="Aeropuerto de llegada"
                        value={values.arrivalAirport || pickupLoc?.name || ""}
                        slotProps={{ input: { readOnly: true } }}
                        helperText="Precargado desde tu lugar de recogida."
                      />
                    ) : (
                      <Autocomplete
                        freeSolo
                        options={locations.map((l) => l.name)}
                        value={values.arrivalAirport || ""}
                        onInputChange={(_, v) => setField("arrivalAirport", v ?? "")}
                        fullWidth
                        renderInput={(params) => <TextField {...params} label="Aeropuerto de llegada" />}
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
                        {arrivalAirportLocked ? "Modificar datos de vuelo" : "Usar aeropuerto de recogida"}
                      </Button>
                    )}
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <TextField fullWidth type="date" label="Fecha de llegada" value={values.arrivalDate}
                      onChange={(e) => setField("arrivalDate", e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
                  </Grid>
                  <Grid size={{ xs: 6, sm: 3 }}>
                    <TextField fullWidth type="time" label="Hora estimada" value={values.arrivalTime}
                      onChange={(e) => setField("arrivalTime", e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
                  </Grid>
                </Grid>
                <Box sx={{ mt: 2 }}>
                  <input ref={arrivalItinRef} type="file" accept="image/png,image/jpeg,image/webp,application/pdf" hidden onChange={(e) => handleItinerary("arrival", e)} />
                  <Button variant="outlined" color="secondary" size="small" onClick={() => arrivalItinRef.current?.click()} disabled={uploadingItin === "arrival"}>
                    {uploadingItin === "arrival" ? "Subiendo..." : values.arrivalItineraryUrl ? "Itinerario cargado ✓" : "Adjuntar itinerario (opcional)"}
                  </Button>
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
                    Imagen, captura o PDF. Opcional.
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
                    <ToggleButton value="no" sx={{ px: 2 }}>Sin vuelo de regreso</ToggleButton>
                    <ToggleButton value="si" sx={{ px: 2 }}>Agregar información de vuelo de regreso</ToggleButton>
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
                          renderInput={(params) => <TextField {...params} label="Aerolínea (regreso)" />}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <TextField
                          fullWidth
                          label="Número de vuelo (regreso)"
                          placeholder="Ej.: UA 1471"
                          value={values.returnFlightNumber}
                          onChange={(e) => setField("returnFlightNumber", e.target.value)}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        {returnAirportLocked ? (
                          <TextField
                            fullWidth
                            label="Aeropuerto de salida"
                            value={values.returnAirport || dropoffLoc?.name || ""}
                            slotProps={{ input: { readOnly: true } }}
                            helperText="Precargado desde tu lugar de devolución."
                          />
                        ) : (
                          <Autocomplete
                            freeSolo
                            options={locations.map((l) => l.name)}
                            value={values.returnAirport || ""}
                            onInputChange={(_, v) => setField("returnAirport", v ?? "")}
                            fullWidth
                            renderInput={(params) => <TextField {...params} label="Aeropuerto de salida" />}
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
                            {returnAirportLocked ? "Modificar datos de vuelo" : "Usar aeropuerto de devolución"}
                          </Button>
                        )}
                      </Grid>
                      <Grid size={{ xs: 6, sm: 3 }}>
                        <TextField fullWidth type="date" label="Fecha" value={values.returnDate}
                          onChange={(e) => setField("returnDate", e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
                      </Grid>
                      <Grid size={{ xs: 6, sm: 3 }}>
                        <TextField fullWidth type="time" label="Hora" value={values.returnTime}
                          onChange={(e) => setField("returnTime", e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
                      </Grid>
                    </Grid>
                    <Box sx={{ mt: 2 }}>
                      <input ref={returnItinRef} type="file" accept="image/png,image/jpeg,image/webp,application/pdf" hidden onChange={(e) => handleItinerary("return", e)} />
                      <Button variant="outlined" color="secondary" size="small" onClick={() => returnItinRef.current?.click()} disabled={uploadingItin === "return"}>
                        {uploadingItin === "return" ? "Subiendo..." : values.returnItineraryUrl ? "Itinerario cargado ✓" : "Adjuntar itinerario de regreso (opcional)"}
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
              ¿Tienes alguna solicitud especial?
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
              <ToggleButton value="no" sx={{ px: 3 }}>No</ToggleButton>
              <ToggleButton value="si" sx={{ px: 3 }}>Sí</ToggleButton>
            </ToggleButtonGroup>

            {hasSpecialRequest && (
              <Box sx={{ mt: 2 }}>
                <TextField
                  fullWidth
                  label="Cuéntanos cómo podemos ayudarte"
                  value={values.specialRequest}
                  onChange={(e) => setField("specialRequest", e.target.value)}
                  multiline
                  minRows={3}
                  placeholder="Ej.: viajo con un niño, evitar ambientadores, etc."
                />
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.75 }}>
                  Las solicitudes especiales están sujetas a disponibilidad y confirmación.
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
                Depósito para asegurar tu reserva
              </Typography>
              <Tooltip title={DEPOSIT_INFO} enterTouchDelay={0} leaveTouchDelay={6000} arrow>
                <IconButton size="small" aria-label="Información sobre el depósito">
                  <InfoOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              El depósito no es obligatorio. Puedes continuar sin depósito y coordinar el pago después.
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
                  Reservar con {money(amount)}
                </ToggleButton>
              ))}
              <ToggleButton value={0} sx={{ px: 2.5 }}>
                Continuar sin depósito
              </ToggleButton>
            </ToggleButtonGroup>
          </CardContent>
        </Card>

        {/* Payment (only when a deposit is chosen and there are enabled methods) */}
        {withDeposit && availableMethods.length > 0 && (
          <Card>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                Pago del depósito ({money(depositChoice)})
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
                    label="Método de pago"
                    value={values.paymentMethod}
                    ref={registerField("paymentMethod")}
                    onChange={(e) => setField("paymentMethod", e.target.value)}
                    error={err("paymentMethod")}
                    helperText={help("paymentMethod")}
                  >
                    {availableMethods.map((m) => (
                      <MenuItem key={m} value={m}>
                        {PAYMENT_METHOD_LABELS[m]}
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
                  {uploading ? "Subiendo..." : values.paymentProofUrl ? "Comprobante cargado ✓" : "Subir comprobante de pago"}
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
                Resumen
              </Typography>
              <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                <Typography variant="body2" color="text.secondary">
                  {money(reservation.dailyPrice)} x {days} {days === 1 ? "día" : "días"}
                </Typography>
                <Typography variant="body2">{money(subtotalRent)}</Typography>
              </Box>
              {pickupFee > 0 && (
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">Cargo de entrega (recogida)</Typography>
                  <Typography variant="body2">{money(pickupFee)}</Typography>
                </Box>
              )}
              {dropoffFee > 0 && (
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
                  <Typography variant="body2" color="text.secondary">Cargo de entrega (devolución)</Typography>
                  <Typography variant="body2">{money(dropoffFee)}</Typography>
                </Box>
              )}
              <Divider sx={{ my: 1 }} />
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                <Typography sx={{ fontWeight: 700 }}>Total</Typography>
                <Typography sx={{ fontWeight: 700 }}>{money(total)}</Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.75 }}>
                <Typography variant="body2" color="text.secondary">Monto reservado</Typography>
                <Typography variant="body2">{money(depositChoice)}</Typography>
              </Box>
              <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.5 }}>
                <Typography sx={{ fontWeight: 700 }}>Saldo pendiente</Typography>
                <Typography sx={{ fontWeight: 700 }}>{money(balanceDue)}</Typography>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                El depósito forma parte del total; no es un cargo adicional. Rentas antes de las
                5:00 p. m. se cobran como día completo.
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
                  He leído y acepto la política de reserva de JERETH RENT CAR y confirmo que la
                  información proporcionada es correcta.
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
            ? "Enviando..."
            : isCorrection
              ? "Reenviar solicitud corregida"
              : "Enviar solicitud de reserva"}
        </Button>
      </Stack>
    </Box>
  );
}
