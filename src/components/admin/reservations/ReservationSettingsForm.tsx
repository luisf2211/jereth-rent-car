"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import Button from "@mui/material/Button";
import Switch from "@mui/material/Switch";
import FormControlLabel from "@mui/material/FormControlLabel";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import Typography from "@mui/material/Typography";
import { reservationSettingsSchema } from "@/lib/validations/reservation";
import { updateReservationSettings } from "@/features/reservations/actions";
import type { ReservationSettingsData } from "@/features/reservations/data";

type FormValues = ReservationSettingsData;

function SectionHeading({ title, hint }: { title: string; hint?: string }) {
  return (
    <Box>
      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
        {title}
      </Typography>
      {hint && (
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
          {hint}
        </Typography>
      )}
    </Box>
  );
}

export default function ReservationSettingsForm({
  initial,
  canEdit = true,
}: {
  initial: ReservationSettingsData;
  canEdit?: boolean;
}) {
  const router = useRouter();
  const [formError, setFormError] = React.useState<string | null>(null);
  const [saved, setSaved] = React.useState(false);

  const {
    control,
    handleSubmit,
    watch,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(reservationSettingsSchema) as Resolver<FormValues>,
    defaultValues: initial,
  });

  const zelleEnabled = watch("zelleEnabled");
  const paypalEnabled = watch("paypalEnabled");
  const cashappEnabled = watch("cashappEnabled");

  const onSubmit = async (values: FormValues) => {
    setFormError(null);
    const res = await updateReservationSettings(values);
    if (res.ok) {
      setSaved(true);
      router.refresh();
      return;
    }
    if (res.fieldErrors) {
      for (const [field, message] of Object.entries(res.fieldErrors)) {
        setError(field as keyof FormValues, { message });
      }
    }
    setFormError(res.message);
  };

  return (
    <>
      <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
        {formError && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {formError}
          </Alert>
        )}

        <Stack spacing={3}>
          {/* Master switch */}
          <Card>
            <CardContent>
              <SectionHeading
                title="Reservas digitales"
                hint="Cuando está activado, el sitio usará el nuevo proceso digital. Cuando está desactivado, se mantiene el flujo actual de WhatsApp. (Aún no conectado al botón público.)"
              />
              <Box sx={{ mt: 1.5 }}>
                <Controller
                  name="digitalEnabled"
                  control={control}
                  render={({ field }) => (
                    <FormControlLabel
                      control={
                        <Switch checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />
                      }
                      label="Reservas digitales activadas"
                    />
                  )}
                />
              </Box>
              <Grid container spacing={3} sx={{ mt: 0.5 }}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Controller
                    name="defaultDeposit"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        type="number"
                        label="Depósito de reserva por defecto"
                        error={Boolean(errors.defaultDeposit)}
                        helperText={errors.defaultDeposit?.message ?? "Se sugiere al crear enlaces"}
                        slotProps={{ input: { startAdornment: <InputAdornment position="start">US$</InputAdornment> } }}
                      />
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <Controller
                    name="paymentInstructions"
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Instrucciones de pago (opcional)"
                        multiline
                        minRows={3}
                        error={Boolean(errors.paymentInstructions)}
                        helperText={errors.paymentInstructions?.message ?? "Texto que verá el cliente al pagar"}
                      />
                    )}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Zelle */}
          <Card>
            <CardContent>
              <Controller
                name="zelleEnabled"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Switch checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />}
                    label="Zelle"
                  />
                )}
              />
              <Grid container spacing={3} sx={{ mt: 0.5, opacity: zelleEnabled ? 1 : 0.6 }}>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Controller
                    name="zelleName"
                    control={control}
                    render={({ field }) => (
                      <TextField {...field} label="Nombre del titular" disabled={!zelleEnabled} fullWidth
                        error={Boolean(errors.zelleName)} helperText={errors.zelleName?.message} />
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Controller
                    name="zelleEmail"
                    control={control}
                    render={({ field }) => (
                      <TextField {...field} label="Correo Zelle" disabled={!zelleEnabled} fullWidth
                        error={Boolean(errors.zelleEmail)} helperText={errors.zelleEmail?.message} />
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 4 }}>
                  <Controller
                    name="zellePhone"
                    control={control}
                    render={({ field }) => (
                      <TextField {...field} label="Teléfono Zelle" disabled={!zelleEnabled} fullWidth
                        error={Boolean(errors.zellePhone)} helperText={errors.zellePhone?.message} />
                    )}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* PayPal */}
          <Card>
            <CardContent>
              <Controller
                name="paypalEnabled"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Switch checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />}
                    label="PayPal"
                  />
                )}
              />
              <Grid container spacing={3} sx={{ mt: 0.5, opacity: paypalEnabled ? 1 : 0.6 }}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Controller
                    name="paypalEmail"
                    control={control}
                    render={({ field }) => (
                      <TextField {...field} label="Correo PayPal" disabled={!paypalEnabled} fullWidth
                        error={Boolean(errors.paypalEmail)} helperText={errors.paypalEmail?.message} />
                    )}
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Controller
                    name="paypalLink"
                    control={control}
                    render={({ field }) => (
                      <TextField {...field} label="Enlace PayPal.me (opcional)" placeholder="https://paypal.me/..."
                        disabled={!paypalEnabled} fullWidth
                        error={Boolean(errors.paypalLink)} helperText={errors.paypalLink?.message} />
                    )}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          {/* Cash App */}
          <Card>
            <CardContent>
              <Controller
                name="cashappEnabled"
                control={control}
                render={({ field }) => (
                  <FormControlLabel
                    control={<Switch checked={field.value} onChange={(e) => field.onChange(e.target.checked)} />}
                    label="Cash App"
                  />
                )}
              />
              <Grid container spacing={3} sx={{ mt: 0.5, opacity: cashappEnabled ? 1 : 0.6 }}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Controller
                    name="cashappTag"
                    control={control}
                    render={({ field }) => (
                      <TextField {...field} label="Cashtag ($usuario)" placeholder="$JerethRentCar"
                        disabled={!cashappEnabled} fullWidth
                        error={Boolean(errors.cashappTag)} helperText={errors.cashappTag?.message} />
                    )}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>

          <Stack direction={{ xs: "column-reverse", sm: "row" }} spacing={2} sx={{ justifyContent: "flex-end" }}>
            <Button type="submit" variant="contained" disabled={isSubmitting || !canEdit}>
              {isSubmitting ? "Guardando..." : "Guardar configuración"}
            </Button>
          </Stack>
        </Stack>
      </Box>

      <Snackbar
        open={saved}
        autoHideDuration={4000}
        onClose={() => setSaved(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert severity="success" variant="filled" onClose={() => setSaved(false)}>
          Configuración de reservas guardada.
        </Alert>
      </Snackbar>
    </>
  );
}
