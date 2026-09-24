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
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import IconButton from "@mui/material/IconButton";
import Link from "@mui/material/Link";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import EditNoteRoundedIcon from "@mui/icons-material/EditNoteRounded";
import {
  updateReservationStatus,
  registerReservationPayment,
  uploadPaymentProof,
} from "@/features/reservations/actions";
import {
  RESERVATION_STATUSES,
  RESERVATION_STATUS_LABELS,
  RESERVATION_SOURCE_LABELS,
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHODS,
  type ReservationStatus,
  type PaymentMethod,
} from "@/lib/validations/reservation";
import type { AdminReservation } from "@/features/reservations/data";
import AddRoundedIcon from "@mui/icons-material/AddRounded";

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

/** One flight leg (arrival or return) rendered as labelled fields. */
function FlightLeg({
  title,
  airline,
  flightNumber,
  airport,
  date,
  time,
  itineraryUrl,
}: {
  title: string;
  airline: string;
  flightNumber: string;
  airport: string;
  date: string;
  time: string;
  itineraryUrl: string;
}) {
  return (
    <Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
        {title}
      </Typography>
      <Grid container spacing={2.5}>
        <Grid size={{ xs: 12, sm: 6 }}><Field label="Aerolínea" value={airline} /></Grid>
        <Grid size={{ xs: 12, sm: 6 }}><Field label="Número de vuelo" value={flightNumber} /></Grid>
        <Grid size={{ xs: 12, sm: 6 }}><Field label="Aeropuerto" value={airport} /></Grid>
        <Grid size={{ xs: 6, sm: 3 }}><Field label="Fecha" value={date} /></Grid>
        <Grid size={{ xs: 6, sm: 3 }}><Field label="Hora" value={time} /></Grid>
      </Grid>
      {itineraryUrl && (
        <Button
          href={itineraryUrl}
          target="_blank"
          rel="noopener noreferrer"
          size="small"
          color="secondary"
          startIcon={<OpenInNewRoundedIcon />}
          sx={{ mt: 1 }}
        >
          Ver itinerario
        </Button>
      )}
    </Box>
  );
}

export default function ReservationDetail({ reservation: r, canEdit }: Props) {
  const router = useRouter();
  const [status, setStatus] = React.useState<ReservationStatus>(r.status);
  const [statusMessage, setStatusMessage] = React.useState(r.statusMessage ?? "");
  const [statusMessageVisible, setStatusMessageVisible] = React.useState(r.statusMessageVisible);
  const [saving, setSaving] = React.useState(false);
  const [snack, setSnack] = React.useState<{ msg: string; error?: boolean } | null>(null);
  const [proofOpen, setProofOpen] = React.useState(false);

  // --- Manual payment registration (admin) ---
  const todayIso = React.useMemo(() => new Date().toISOString().slice(0, 10), []);
  const [payOpen, setPayOpen] = React.useState(false);
  const [payAmount, setPayAmount] = React.useState("");
  const [payMethod, setPayMethod] = React.useState<PaymentMethod>("otro");
  const [payDate, setPayDate] = React.useState(todayIso);
  const [payNote, setPayNote] = React.useState("");
  const [payProofUrl, setPayProofUrl] = React.useState("");
  const [payUploading, setPayUploading] = React.useState(false);
  const [paySaving, setPaySaving] = React.useState(false);
  const payFileRef = React.useRef<HTMLInputElement>(null);

  const resetPayForm = () => {
    setPayAmount("");
    setPayMethod("otro");
    setPayDate(todayIso);
    setPayNote("");
    setPayProofUrl("");
    if (payFileRef.current) payFileRef.current.value = "";
  };

  const handlePayProof = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPayUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await uploadPaymentProof(fd);
    setPayUploading(false);
    if (payFileRef.current) payFileRef.current.value = "";
    if (res.ok) setPayProofUrl(res.url);
    else setSnack({ msg: res.message, error: true });
  };

  const submitPayment = async () => {
    setPaySaving(true);
    const res = await registerReservationPayment(r.id, {
      amount: payAmount,
      method: payMethod,
      paidAt: payDate,
      proofUrl: payProofUrl,
      note: payNote,
    });
    setPaySaving(false);
    setSnack({ msg: res.message ?? "", error: !res.ok });
    if (res.ok) {
      setPayOpen(false);
      resetPayForm();
      router.refresh();
    }
  };

  // The message + visibility apply to "rejected" and "needs_fix".
  const usesMessage = status === "rejected" || status === "needs_fix";
  const dirty =
    status !== r.status ||
    (usesMessage &&
      (statusMessage !== (r.statusMessage ?? "") || statusMessageVisible !== r.statusMessageVisible));

  const saveStatus = async () => {
    setSaving(true);
    const res = await updateReservationStatus(r.id, {
      status,
      statusMessage: usesMessage ? statusMessage : "",
      statusMessageVisible: usesMessage ? statusMessageVisible : false,
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
                  <Chip
                    label={r.depositPaid > 0 ? `Con depósito (${money(r.depositPaid)})` : "Sin depósito"}
                    size="small"
                    variant="outlined"
                    color={r.depositPaid > 0 ? "success" : "default"}
                  />
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Creada el {dateTimeLabel(r.createdAt)} · Última actualización {dateTimeLabel(r.updatedAt)}
                </Typography>
                {(r.status === "rejected" || r.status === "needs_fix") && r.statusMessage && (
                  <Alert severity={r.status === "rejected" ? "error" : "warning"} sx={{ mt: 2 }}>
                    <strong>
                      {r.status === "rejected" ? "Motivo del rechazo" : "Corrección solicitada"}:
                    </strong>{" "}
                    {r.statusMessage}
                    <Typography variant="caption" sx={{ display: "block", mt: 0.5 }}>
                      {r.statusMessageVisible ? "Visible para el cliente" : "Nota interna (no visible al cliente)"}
                    </Typography>
                  </Alert>
                )}
                {r.specialRequest && (
                  <Alert severity="warning" icon={false} sx={{ mt: 2 }}>
                    <strong>⚠ Solicitud especial del cliente:</strong> {r.specialRequest}
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
                  <Grid size={{ xs: 12, sm: 6 }}><Field label="País de donde nos visita" value={r.country} /></Grid>
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
                  <Grid size={{ xs: 6, sm: 3 }}><Field label="Subtotal renta" value={money(r.subtotalRent || r.dailyPrice * r.billedDays)} /></Grid>
                  <Grid size={{ xs: 6, sm: 3 }}><Field label="Cargo entrega (recogida)" value={money(r.pickupFee)} /></Grid>
                  <Grid size={{ xs: 6, sm: 3 }}><Field label="Cargo entrega (devolución)" value={money(r.dropoffFee)} /></Grid>
                  <Grid size={{ xs: 6, sm: 3 }}><Field label="Total" value={money(r.estimatedTotal)} /></Grid>
                  <Grid size={{ xs: 6, sm: 3 }}><Field label="Total pagado" value={money(r.totalPaid)} /></Grid>
                  <Grid size={{ xs: 6, sm: 3 }}><Field label="Saldo pendiente" value={money(r.outstandingBalance)} /></Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Payments / Deposits (administrative) */}
            <Card>
              <CardContent>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1, mb: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    Pagos / Depósitos
                  </Typography>
                  {canEdit && (
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<AddRoundedIcon />}
                      onClick={() => setPayOpen(true)}
                    >
                      Registrar pago
                    </Button>
                  )}
                </Box>

                {/* Money summary: total, paid, balance */}
                <Grid container spacing={2.5} sx={{ mb: 2 }}>
                  <Grid size={{ xs: 4 }}><Field label="Total de la reserva" value={money(r.estimatedTotal)} /></Grid>
                  <Grid size={{ xs: 4 }}><Field label="Total pagado" value={money(r.totalPaid)} /></Grid>
                  <Grid size={{ xs: 4 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                      Balance pendiente
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: r.outstandingBalance > 0 ? "warning.main" : "success.main" }}>
                      {money(r.outstandingBalance)}
                    </Typography>
                  </Grid>
                </Grid>

                {/* Initial customer deposit (from the digital flow), when present. */}
                {r.depositPaid > 0 && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
                    Incluye depósito inicial del cliente: {money(r.depositPaid)}
                    {r.paymentMethod ? ` · ${PAYMENT_METHOD_LABELS[r.paymentMethod]}` : ""}
                  </Typography>
                )}

                <Divider sx={{ my: 1.5 }} />

                {/* Payment history */}
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                  Historial de pagos
                </Typography>
                {r.payments.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    Aún no hay pagos manuales registrados.
                  </Typography>
                ) : (
                  <Stack spacing={1.5}>
                    {r.payments.map((p) => (
                      <Box
                        key={p.id}
                        sx={{
                          border: "1px solid",
                          borderColor: "divider",
                          borderRadius: 2,
                          p: 1.5,
                          display: "flex",
                          alignItems: "flex-start",
                          justifyContent: "space-between",
                          gap: 2,
                        }}
                      >
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {money(p.amount)} · {PAYMENT_METHOD_LABELS[p.method]}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                            {p.paidAt}
                          </Typography>
                          {p.note && (
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                              {p.note}
                            </Typography>
                          )}
                        </Box>
                        {p.proofUrl && (
                          <Button
                            href={p.proofUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            size="small"
                            color="secondary"
                            startIcon={<OpenInNewRoundedIcon />}
                            sx={{ flexShrink: 0 }}
                          >
                            Comprobante
                          </Button>
                        )}
                      </Box>
                    ))}
                  </Stack>
                )}

                <Divider sx={{ my: 2 }} />

                <Grid container spacing={2.5} sx={{ mb: proof ? 2 : 0 }}>
                  <Grid size={{ xs: 12, sm: 6 }}>
                    <Field
                      label="Método de pago (cliente)"
                      value={r.paymentMethod ? PAYMENT_METHOD_LABELS[r.paymentMethod] : null}
                    />
                  </Grid>
                </Grid>

                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                  Comprobante de pago (cliente)
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

            {/* Flight information */}
            {(r.flight.hasArrivalFlight || r.flight.hasReturnFlight) && (
              <Card>
                <CardContent>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                    Información de vuelo
                  </Typography>
                  <Stack spacing={2.5}>
                    {r.flight.hasArrivalFlight && (
                      <FlightLeg
                        title="Llegada"
                        airline={r.flight.arrivalAirline}
                        flightNumber={r.flight.arrivalFlightNumber}
                        airport={r.flight.arrivalAirport}
                        date={r.flight.arrivalDate}
                        time={r.flight.arrivalTime}
                        itineraryUrl={r.flight.arrivalItineraryUrl}
                      />
                    )}
                    {r.flight.hasReturnFlight && (
                      <>
                        <Divider />
                        <FlightLeg
                          title="Regreso"
                          airline={r.flight.returnAirline}
                          flightNumber={r.flight.returnFlightNumber}
                          airport={r.flight.returnAirport}
                          date={r.flight.returnDate}
                          time={r.flight.returnTime}
                          itineraryUrl={r.flight.returnItineraryUrl}
                        />
                      </>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            )}
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

              {usesMessage && (
                <>
                  <TextField
                    fullWidth
                    label={status === "rejected" ? "Motivo del rechazo" : "Qué debe corregir el cliente"}
                    value={statusMessage}
                    onChange={(e) => setStatusMessage(e.target.value)}
                    multiline
                    minRows={3}
                    disabled={!canEdit}
                    helperText={
                      status === "needs_fix"
                        ? "Instrucciones de lo que el cliente debe corregir."
                        : "Motivo de por qué no se aprobó la solicitud."
                    }
                    sx={{ mb: 1 }}
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={statusMessageVisible}
                        onChange={(e) => setStatusMessageVisible(e.target.checked)}
                        disabled={!canEdit}
                      />
                    }
                    label="Mostrar este mensaje al cliente"
                    sx={{ mb: 1 }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 2 }}>
                    {statusMessageVisible
                      ? "El cliente verá este mensaje en su portal."
                      : "Nota interna: el cliente no verá este mensaje."}
                  </Typography>
                </>
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
                  {status !== "needs_fix" && (
                    <Button
                      variant="outlined"
                      color="warning"
                      startIcon={<EditNoteRoundedIcon />}
                      disabled={saving}
                      onClick={() => setStatus("needs_fix")}
                    >
                      Requiere corrección
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

      {/* Register manual payment dialog */}
      <Dialog open={payOpen} onClose={() => (paySaving ? null : setPayOpen(false))} maxWidth="xs" fullWidth>
        <Box sx={{ p: 3 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
            <Typography variant="h6" sx={{ fontWeight: 800 }}>
              Registrar pago
            </Typography>
            <IconButton onClick={() => setPayOpen(false)} aria-label="Cerrar" disabled={paySaving}>
              <CloseRoundedIcon />
            </IconButton>
          </Box>
          <Stack spacing={2}>
            <TextField
              label="Monto recibido (US$)"
              type="number"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              slotProps={{ htmlInput: { min: 1, step: 1 } }}
              fullWidth
            />
            <TextField
              select
              label="Método de pago"
              value={payMethod}
              onChange={(e) => setPayMethod(e.target.value as PaymentMethod)}
              fullWidth
            >
              {PAYMENT_METHODS.map((m) => (
                <MenuItem key={m} value={m}>
                  {PAYMENT_METHOD_LABELS[m]}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Fecha del pago"
              type="date"
              value={payDate}
              onChange={(e) => setPayDate(e.target.value)}
              slotProps={{ inputLabel: { shrink: true } }}
              fullWidth
            />
            <Box>
              <input
                ref={payFileRef}
                type="file"
                accept="image/png,image/jpeg,image/webp"
                hidden
                onChange={handlePayProof}
              />
              <Button
                variant="outlined"
                color="secondary"
                onClick={() => payFileRef.current?.click()}
                disabled={payUploading}
              >
                {payUploading ? "Subiendo..." : payProofUrl ? "Comprobante cargado ✓" : "Subir comprobante (opcional)"}
              </Button>
            </Box>
            <TextField
              label="Nota (opcional)"
              value={payNote}
              onChange={(e) => setPayNote(e.target.value)}
              multiline
              minRows={2}
              fullWidth
            />
            <Button
              variant="contained"
              onClick={submitPayment}
              disabled={paySaving || payUploading || !payAmount}
            >
              {paySaving ? "Registrando..." : "Registrar pago"}
            </Button>
          </Stack>
        </Box>
      </Dialog>

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
