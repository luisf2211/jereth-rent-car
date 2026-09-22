"use client";

import * as React from "react";
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
import { submitReservation, uploadPaymentProof } from "@/features/reservations/actions";
import { rentalDays, meetsMinimumRental, MIN_RENTAL_DAYS } from "@/utils/rental-days";
import {
  PAYMENT_METHODS,
  PAYMENT_METHOD_LABELS,
  type PaymentMethod,
} from "@/lib/validations/reservation";
import type { ReservationFormData } from "@/features/reservations/data";

interface PaymentMethodsView {
  zelle: { name: string; email: string; phone: string } | null;
  paypal: { email: string; link: string } | null;
  cashapp: { tag: string } | null;
  instructions: string;
}

interface Props {
  reservation: ReservationFormData;
  paymentMethods: PaymentMethodsView;
}

function money(n: number) {
  return `US$${n.toLocaleString("en-US")}`;
}

export default function ReservationForm({ reservation, paymentMethods }: Props) {
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
    pickupLocation: reservation.pickupLocation,
    dropoffLocation: reservation.dropoffLocation,
    paymentMethod: "" as "" | PaymentMethod,
    paymentProofUrl: "",
  });
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [done, setDone] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  const setField = (k: string, v: string) => setValues((s) => ({ ...s, [k]: v }));

  // Live pricing using the shared rental-days rules.
  const days = rentalDays({
    pickupDate: values.pickupDate,
    dropoffDate: values.dropoffDate,
    pickupTime: values.pickupTime,
    dropoffTime: values.dropoffTime,
  });
  const estimatedTotal = days * reservation.dailyPrice;
  const bothDates = Boolean(values.pickupDate && values.dropoffDate);
  const belowMinimum = bothDates && days > 0 && !meetsMinimumRental(days);

  const availableMethods = PAYMENT_METHODS.filter((m) => {
    if (m === "zelle") return Boolean(paymentMethods.zelle);
    if (m === "paypal") return Boolean(paymentMethods.paypal);
    if (m === "cashapp") return Boolean(paymentMethods.cashapp);
    return true; // "otro" always allowed
  });

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

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setFormError(null);
    setFieldErrors({});
    const res = await submitReservation(reservation.token, {
      ...values,
      paymentMethod: values.paymentMethod || undefined,
    });
    setSubmitting(false);
    if (res.ok) {
      setDone(true);
      return;
    }
    setFieldErrors(res.fieldErrors ?? {});
    setFormError(res.message);
  };

  if (done) {
    return (
      <Card>
        <CardContent sx={{ textAlign: "center", py: 6 }}>
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
            ¡Reserva enviada!
          </Typography>
          <Typography color="text.secondary">
            Hemos recibido tus datos para la reserva {reservation.code}. Nos pondremos en contacto
            contigo para confirmar los detalles.
          </Typography>
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
                <TextField fullWidth label="Nombre completo" value={values.customerName}
                  onChange={(e) => setField("customerName", e.target.value)} error={err("customerName")} helperText={help("customerName")} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth type="email" label="Correo electrónico" value={values.email}
                  onChange={(e) => setField("email", e.target.value)} error={err("email")} helperText={help("email")} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="WhatsApp / Teléfono" value={values.phone}
                  onChange={(e) => setField("phone", e.target.value)} error={err("phone")} helperText={help("phone")} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="País" value={values.country}
                  onChange={(e) => setField("country", e.target.value)} error={err("country")} helperText={help("country")} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="Identificación o pasaporte" value={values.idOrPassport}
                  onChange={(e) => setField("idOrPassport", e.target.value)} error={err("idOrPassport")} helperText={help("idOrPassport")} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="Licencia de conducir" value={values.driverLicense}
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
                <TextField fullWidth type="date" label="Fecha de recogida" value={values.pickupDate}
                  onChange={(e) => setField("pickupDate", e.target.value)} slotProps={{ inputLabel: { shrink: true } }}
                  error={err("pickupDate")} helperText={help("pickupDate")} />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField fullWidth type="time" label="Hora de recogida" value={values.pickupTime}
                  onChange={(e) => setField("pickupTime", e.target.value)} slotProps={{ inputLabel: { shrink: true } }}
                  error={err("pickupTime")} helperText={help("pickupTime")} />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField fullWidth type="date" label="Fecha de devolución" value={values.dropoffDate}
                  onChange={(e) => setField("dropoffDate", e.target.value)} slotProps={{ inputLabel: { shrink: true } }}
                  error={err("dropoffDate")} helperText={help("dropoffDate")} />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField fullWidth type="time" label="Hora de devolución" value={values.dropoffTime}
                  onChange={(e) => setField("dropoffTime", e.target.value)} slotProps={{ inputLabel: { shrink: true } }}
                  error={err("dropoffTime")} helperText={help("dropoffTime")} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="Lugar de recogida" value={values.pickupLocation}
                  onChange={(e) => setField("pickupLocation", e.target.value)} />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField fullWidth label="Lugar de devolución" value={values.dropoffLocation}
                  onChange={(e) => setField("dropoffLocation", e.target.value)} />
              </Grid>
            </Grid>

            {belowMinimum && (
              <Alert severity="warning" sx={{ mt: 2 }}>
                La renta mínima permitida es de {MIN_RENTAL_DAYS} días. Por favor, selecciona una fecha
                de devolución que complete al menos {MIN_RENTAL_DAYS} días de renta.
              </Alert>
            )}

            {days > 0 && (
              <Box sx={{ mt: 2 }}>
                <Divider sx={{ mb: 1.5 }} />
                <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="body2" color="text.secondary">
                    {money(reservation.dailyPrice)} x {days} {days === 1 ? "día" : "días"}
                  </Typography>
                  <Typography variant="body2">{money(estimatedTotal)}</Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.5 }}>
                  <Typography sx={{ fontWeight: 700 }}>Total estimado</Typography>
                  <Typography sx={{ fontWeight: 700 }}>{money(estimatedTotal)}</Typography>
                </Box>
                {reservation.reservationDeposit > 0 && (
                  <Box sx={{ display: "flex", justifyContent: "space-between", mt: 0.5 }}>
                    <Typography variant="body2" color="text.secondary">Depósito de reserva</Typography>
                    <Typography variant="body2">{money(reservation.reservationDeposit)}</Typography>
                  </Box>
                )}
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.75 }}>
                  Rentas antes de las 5:00 p. m. se cobran como día completo.
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Payment */}
        {availableMethods.length > 0 && (
          <Card>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                Pago del depósito
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
                    onChange={(e) => setField("paymentMethod", e.target.value)}
                  >
                    {availableMethods.map((m) => (
                      <MenuItem key={m} value={m}>
                        {PAYMENT_METHOD_LABELS[m]}
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </Grid>

              {/* Payment details for the chosen method */}
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

              <Box sx={{ mt: 2 }}>
                <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" hidden onChange={handleFile} />
                <Button variant="outlined" color="secondary" onClick={() => fileRef.current?.click()} disabled={uploading}>
                  {uploading ? "Subiendo..." : values.paymentProofUrl ? "Comprobante cargado ✓" : "Subir comprobante de pago"}
                </Button>
              </Box>
            </CardContent>
          </Card>
        )}

        <Button type="submit" variant="contained" size="large" disabled={submitting || belowMinimum}>
          {submitting ? "Enviando..." : "Enviar reserva"}
        </Button>
      </Stack>
    </Box>
  );
}
