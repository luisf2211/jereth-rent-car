"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Grid from "@mui/material/Grid";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Divider from "@mui/material/Divider";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import Dialog from "@mui/material/Dialog";
import IconButton from "@mui/material/IconButton";
import Link from "@mui/material/Link";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import { updateReservationStatus } from "@/features/reservations/actions";
import {
  RESERVATION_STATUSES,
  RESERVATION_STATUS_LABELS,
  RESERVATION_SOURCE_LABELS,
  PAYMENT_METHOD_LABELS,
  type ReservationStatus,
} from "@/lib/validations/reservation";
import type { AdminReservation } from "@/features/reservations/data";

interface Props {
  reservation: AdminReservation;
  canEdit: boolean;
}

const STATUS_COLOR: Record<ReservationStatus, "default" | "info" | "warning" | "success" | "error"> = {
  link_created: "info",
  pending: "warning",
  confirmed: "success",
  needs_fix: "default",
  rejected: "error",
  cancelled: "default",
};

function money(n: number) {
  return `US$${n.toLocaleString("en-US")}`;
}

function dateTimeLabel(iso: string) {
  return new Date(iso).toLocaleString("es-DO", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

/** A labelled read-only field for the expediente. */
function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: 500 }}>
        {value && value.length > 0 ? value : "—"}
      </Typography>
    </Box>
  );
}

/** Whether a URL points to an image we can preview inline. */
function isImageUrl(url: string): boolean {
  return /\.(png|jpe?g|webp|gif|avif)(\?|$)/i.test(url);
}

export default function ReservationDetail({ reservation: r, canEdit }: Props) {
  const router = useRouter();
  const [status, setStatus] = React.useState<ReservationStatus>(r.status);
  const [rejectionReason, setRejectionReason] = React.useState(r.rejectionReason ?? "");
  const [saving, setSaving] = React.useState(false);
  const [snack, setSnack] = React.useState<{ msg: string; error?: boolean } | null>(null);
  const [proofOpen, setProofOpen] = React.useState(false);

  const dirty = status !== r.status || (status === "rejected" && rejectionReason !== (r.rejectionReason ?? ""));

  const saveStatus = async () => {
    setSaving(true);
    const res = await updateReservationStatus(r.id, {
      status,
      rejectionReason: status === "rejected" ? rejectionReason : "",
    });
    setSaving(false);
    setSnack({ msg: res.message ?? "", error: !res.ok });
    if (res.ok) router.refresh();
  };

  const pickup = [r.pickupDate, r.pickupTime].filter(Boolean).join(" ");
  const dropoff = [r.dropoffDate, r.dropoffTime].filter(Boolean).join(" ");
  const proof = r.paymentProofUrl;

  return (
    <>
      <Grid container spacing={3}>
        {/* Left column: the expediente */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Stack spacing={3}>
            {/* Header / status summary */}
            <Card>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", mb: 1 }}>
                  <Typography variant="h6" sx={{ fontWeight: 800 }}>
                    {r.code}
                  </Typography>
                  <Chip label={RESERVATION_STATUS_LABELS[r.status]} color={STATUS_COLOR[r.status]} size="small" />
                  <Chip label={RESERVATION_SOURCE_LABELS[r.source]} variant="outlined" size="small" />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Creada el {dateTimeLabel(r.createdAt)} · Última actualización {dateTimeLabel(r.updatedAt)}
                </Typography>
                {r.status === "rejected" && r.rejectionReason && (
                  <Alert severity="error" sx={{ mt: 2 }}>
                    <strong>Motivo del rechazo:</strong> {r.rejectionReason}
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Customer */}
            <Card>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                  Datos del cliente
                </Typography>
                <Grid container spacing={2.5}>
                  <Grid size={{ xs: 12, sm: 6 }}><Field label="Nombre completo" value={r.customerName} /></Grid>
                  <Grid size={{ xs: 12, sm: 6 }}><Field label="Correo electrónico" value={r.email} /></Grid>
                  <Grid size={{ xs: 12, sm: 6 }}><Field label="WhatsApp / Teléfono" value={r.phone} /></Grid>
                  <Grid size={{ xs: 12, sm: 6 }}><Field label="País" value={r.country} /></Grid>
                  <Grid size={{ xs: 12, sm: 6 }}><Field label="Identificación o pasaporte" value={r.idOrPassport} /></Grid>
                  <Grid size={{ xs: 12, sm: 6 }}><Field label="Licencia de conducir" value={r.driverLicense} /></Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Rental */}
            <Card>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                  Detalles de la renta
                </Typography>
                <Grid container spacing={2.5}>
                  <Grid size={{ xs: 12, sm: 6 }}><Field label="Vehículo" value={r.vehicleTitle} /></Grid>
                  <Grid size={{ xs: 12, sm: 6 }}><Field label="Recogida" value={pickup} /></Grid>
                  <Grid size={{ xs: 12, sm: 6 }}><Field label="Devolución" value={dropoff} /></Grid>
                  <Grid size={{ xs: 12, sm: 6 }}><Field label="Lugar de recogida" value={r.pickupLocation} /></Grid>
                  <Grid size={{ xs: 12, sm: 6 }}><Field label="Lugar de devolución" value={r.dropoffLocation} /></Grid>
                </Grid>

                <Divider sx={{ my: 2 }} />

                <Grid container spacing={2.5}>
                  <Grid size={{ xs: 6, sm: 3 }}><Field label="Precio por día" value={money(r.dailyPrice)} /></Grid>
                  <Grid size={{ xs: 6, sm: 3 }}><Field label="Días cobrados" value={String(r.billedDays)} /></Grid>
                  <Grid size={{ xs: 6, sm: 3 }}><Field label="Total de la renta" value={money(r.estimatedTotal)} /></Grid>
                  <Grid size={{ xs: 6, sm: 3 }}><Field label="Depósito de reserva" value={money(r.reservationDeposit)} /></Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Payment */}
            <Card>
              <CardContent>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                  Pago
                </Typography>
                <Grid container spacing={2.5} sx={{ mb: proof ? 2 : 0 }}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Field
                      label="Método de pago"
                      value={r.paymentMethod ? PAYMENT_METHOD_LABELS[r.paymentMethod] : null}
                    />
                  </Grid>
                </Grid>

                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                  Comprobante de pago
                </Typography>
                {!proof ? (
                  <Typography variant="body2" color="text.secondary">
                    El cliente aún no ha subido un comprobante.
                  </Typography>
                ) : isImageUrl(proof) ? (
                  <Box>
                    <Box
                      component="button"
                      type="button"
                      onClick={() => setProofOpen(true)}
                      aria-label="Ampliar comprobante"
                      sx={{
                        p: 0,
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: 2,
                        overflow: "hidden",
                        cursor: "zoom-in",
                        display: "block",
                        maxWidth: 320,
                        bgcolor: "grey.100",
                      }}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={proof}
                        alt="Comprobante de pago"
                        style={{ width: "100%", height: "auto", display: "block" }}
                      />
                    </Box>
                    <Button
                      href={proof}
                      target="_blank"
                      rel="noopener noreferrer"
                      size="small"
                      color="secondary"
                      startIcon={<OpenInNewRoundedIcon />}
                      sx={{ mt: 1 }}
                    >
                      Abrir en nueva pestaña
                    </Button>
                  </Box>
                ) : (
                  <Button
                    href={proof}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="outlined"
                    color="secondary"
                    startIcon={<OpenInNewRoundedIcon />}
                  >
                    Ver comprobante
                  </Button>
                )}
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        {/* Right column: verification / status control */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ position: { md: "sticky" }, top: { md: 96 } }}>
            <CardContent>
              <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                Verificación
              </Typography>

              <TextField
                select
                fullWidth
                label="Estado"
                value={status}
                onChange={(e) => setStatus(e.target.value as ReservationStatus)}
                disabled={!canEdit}
                sx={{ mb: 2 }}
              >
                {RESERVATION_STATUSES.map((s) => (
                  <MenuItem key={s} value={s}>
                    {RESERVATION_STATUS_LABELS[s]}
                  </MenuItem>
                ))}
              </TextField>

              {status === "rejected" && (
                <TextField
                  fullWidth
                  label="Motivo del rechazo (opcional)"
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  multiline
                  minRows={3}
                  disabled={!canEdit}
                  helperText="Se guardará para usarlo en las notificaciones al cliente."
                  sx={{ mb: 2 }}
                />
              )}

              {canEdit && (
                <Stack spacing={1.5}>
                  <Button
                    variant="contained"
                    onClick={saveStatus}
                    disabled={saving || !dirty}
                  >
                    {saving ? "Guardando..." : "Guardar estado"}
                  </Button>

                  {/* Quick actions for the common verify flow */}
                  {status !== "confirmed" && (
                    <Button
                      variant="outlined"
                      color="success"
                      startIcon={<CheckCircleRoundedIcon />}
                      disabled={saving}
                      onClick={() => setStatus("confirmed")}
                    >
                      Marcar como confirmada
                    </Button>
                  )}
                  {status !== "rejected" && (
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<CancelRoundedIcon />}
                      disabled={saving}
                      onClick={() => setStatus("rejected")}
                    >
                      Marcar como rechazada
                    </Button>
                  )}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Fullscreen proof viewer */}
      {proof && isImageUrl(proof) && (
        <Dialog open={proofOpen} onClose={() => setProofOpen(false)} maxWidth="lg">
          <Box sx={{ position: "relative", bgcolor: "#0A0A0A" }}>
            <IconButton
              onClick={() => setProofOpen(false)}
              aria-label="Cerrar"
              sx={{ position: "absolute", top: 8, right: 8, bgcolor: "rgba(255,255,255,0.9)", "&:hover": { bgcolor: "common.white" } }}
            >
              <CloseRoundedIcon />
            </IconButton>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={proof}
              alt="Comprobante de pago"
              style={{ display: "block", maxWidth: "90vw", maxHeight: "88vh", objectFit: "contain" }}
            />
          </Box>
        </Dialog>
      )}

      <Snackbar
        open={Boolean(snack)}
        autoHideDuration={4000}
        onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        {snack ? (
          <Alert severity={snack.error ? "error" : "success"} variant="filled" onClose={() => setSnack(null)}>
            {snack.msg}
          </Alert>
        ) : undefined}
      </Snackbar>
    </>
  );
}
