"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import InputAdornment from "@mui/material/InputAdornment";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Grid from "@mui/material/Grid";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import Divider from "@mui/material/Divider";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import EmptyState from "@/components/ui/EmptyState";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import {
  createReservationLink,
  deleteReservation,
} from "@/features/reservations/actions";
import {
  RESERVATION_STATUS_LABELS,
  RESERVATION_SOURCE_LABELS,
  ADMIN_SOURCE_OPTIONS,
  type ReservationStatus,
} from "@/lib/validations/reservation";
import type { AdminReservation } from "@/features/reservations/data";

/**
 * Tabs are filters over the existing reservation list — no copies or separate
 * tables. Each tab maps to a set of statuses.
 *  - todas: everything
 *  - por_revisar: needs admin attention (pending, needs_fix, link_created)
 *  - confirmadas: confirmed (a confirmed reservation can still be a future rental)
 *  - finalizadas: prepared for finished rentals (no "finished" status yet → empty)
 *  - canceladas: cancelled or rejected (process no longer continues)
 */
type ReservationTab = "todas" | "por_revisar" | "confirmadas" | "finalizadas" | "canceladas";

const TAB_STATUSES: Record<Exclude<ReservationTab, "todas">, ReservationStatus[]> = {
  por_revisar: ["pending", "needs_fix", "link_created"],
  confirmadas: ["confirmed"],
  // No "finished" status exists yet; this tab is prepared for later.
  finalizadas: [],
  canceladas: ["cancelled", "rejected"],
};

function inTab(r: AdminReservation, tab: ReservationTab): boolean {
  if (tab === "todas") return true;
  return TAB_STATUSES[tab].includes(r.status);
}

interface VehicleOption {
  id: string;
  label: string;
  dailyPrice: number;
}

interface Props {
  reservations: AdminReservation[];
  vehicles: VehicleOption[];
  defaultDeposit: number;
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

export default function ReservationsManager({ reservations, vehicles, defaultDeposit, canEdit }: Props) {
  const router = useRouter();
  const [snack, setSnack] = React.useState<{ msg: string; error?: boolean } | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<AdminReservation | null>(null);

  const notify = (msg: string, error?: boolean) => {
    setSnack({ msg, error });
    if (!error) router.refresh();
  };

  // ---- Tabs (filters over the existing list) ----
  const [tab, setTab] = React.useState<ReservationTab>("todas");
  const counts = React.useMemo(
    () => ({
      todas: reservations.length,
      por_revisar: reservations.filter((r) => inTab(r, "por_revisar")).length,
      confirmadas: reservations.filter((r) => inTab(r, "confirmadas")).length,
      finalizadas: reservations.filter((r) => inTab(r, "finalizadas")).length,
      canceladas: reservations.filter((r) => inTab(r, "canceladas")).length,
    }),
    [reservations]
  );
  // The list is already sorted (deposit priority) by the data layer; filtering
  // preserves that order.
  const visible = reservations.filter((r) => inTab(r, tab));

  // ---- Create link dialog ----
  const [open, setOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [createdUrl, setCreatedUrl] = React.useState<string | null>(null);
  const [createdCode, setCreatedCode] = React.useState<string | null>(null);

  const [form, setForm] = React.useState({
    vehicleId: "",
    source: "whatsapp",
    pickupDate: "",
    pickupTime: "",
    dropoffDate: "",
    dropoffTime: "",
    pickupLocation: "",
    dropoffLocation: "",
    dailyPrice: "",
  });

  const setField = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const openCreate = () => {
    setForm({
      vehicleId: "",
      source: "whatsapp",
      pickupDate: "",
      pickupTime: "",
      dropoffDate: "",
      dropoffTime: "",
      pickupLocation: "",
      dropoffLocation: "",
      dailyPrice: "",
    });
    setFormError(null);
    setCreatedUrl(null);
    setCreatedCode(null);
    setOpen(true);
  };

  const onVehicleChange = (id: string) => {
    const v = vehicles.find((x) => x.id === id);
    // Pre-fill the daily price from the vehicle if empty.
    setForm((f) => ({ ...f, vehicleId: id, dailyPrice: f.dailyPrice || (v ? String(v.dailyPrice) : "") }));
  };

  const submitCreate = async () => {
    setSaving(true);
    setFormError(null);
    const res = await createReservationLink({
      vehicleId: form.vehicleId,
      source: form.source,
      pickupDate: form.pickupDate,
      pickupTime: form.pickupTime,
      dropoffDate: form.dropoffDate,
      dropoffTime: form.dropoffTime,
      pickupLocation: form.pickupLocation,
      dropoffLocation: form.dropoffLocation,
      dailyPrice: form.dailyPrice ? Number(form.dailyPrice) : 0,
    });
    setSaving(false);
    if (res.ok) {
      const url = `${window.location.origin}/reservar/${res.token}`;
      setCreatedUrl(url);
      setCreatedCode(res.code);
      router.refresh();
    } else {
      setFormError(res.message);
    }
  };

  const copyUrl = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setSnack({ msg: "Enlace copiado al portapapeles." });
    } catch {
      setSnack({ msg: "No se pudo copiar. Copia el enlace manualmente.", error: true });
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const res = await deleteReservation(deleteTarget.id);
    setDeleteTarget(null);
    notify(res.message ?? "", !res.ok);
  };

  return (
    <>
      {canEdit && (
        <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
          <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={openCreate}>
            Crear enlace de reserva
          </Button>
        </Box>
      )}

      {/* Tabs / filters */}
      <Card sx={{ mb: 2 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v as ReservationTab)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ px: 1, "& .MuiTab-root": { minHeight: 56 } }}
        >
          <Tab value="todas" label={`Todas (${counts.todas})`} />
          <Tab value="por_revisar" label={`Por revisar (${counts.por_revisar})`} />
          <Tab value="confirmadas" label={`Confirmadas (${counts.confirmadas})`} />
          <Tab value="finalizadas" label={`Finalizadas (${counts.finalizadas})`} />
          <Tab value="canceladas" label={`Canceladas / Rechazadas (${counts.canceladas})`} />
        </Tabs>
      </Card>

      {reservations.length === 0 ? (
        <EmptyState title="Aún no hay reservas. Crea un enlace para enviar a un cliente." />
      ) : visible.length === 0 ? (
        <EmptyState title="No hay reservas en esta categoría." />
      ) : (
        <Stack spacing={1.5}>
          {visible.map((r) => (
            <Card key={r.id}>
              <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 2, flexWrap: "wrap" }}>
                  <Box
                    onClick={() => router.push(`/admin/reservations/${r.id}`)}
                    sx={{
                      flexGrow: 1,
                      minWidth: 220,
                      cursor: "pointer",
                      borderRadius: 1,
                      transition: "background-color 0.15s",
                      "&:hover": { bgcolor: "action.hover" },
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", mb: 0.5 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                        {r.code}
                      </Typography>
                      {/* Current status (label only — no changing from the list) */}
                      <Chip
                        label={RESERVATION_STATUS_LABELS[r.status]}
                        size="small"
                        color={STATUS_COLOR[r.status]}
                      />
                      {/* Origin — separate from deposit, both stay visible */}
                      <Chip label={RESERVATION_SOURCE_LABELS[r.source]} size="small" variant="outlined" />
                      {/* Deposit indicator (money received) */}
                      <Chip
                        label={r.depositPaid > 0 ? `Con depósito · ${money(r.depositPaid)}` : "Sin depósito"}
                        size="small"
                        color={r.depositPaid > 0 ? "success" : "default"}
                        variant={r.depositPaid > 0 ? "filled" : "outlined"}
                      />
                      {/* Special request warning */}
                      {r.specialRequest && (
                        <Chip label="⚠ Solicitud especial" size="small" color="warning" />
                      )}
                      {/* Flight info indicator */}
                      {(r.flight.hasArrivalFlight || r.flight.hasReturnFlight) && (
                        <Chip label="✈ Vuelo registrado" size="small" variant="outlined" color="info" />
                      )}
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {r.vehicleTitle}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {r.customerName ? `${r.customerName}` : "Sin datos del cliente todavía"}
                      {r.phone ? ` · ${r.phone}` : ""}
                    </Typography>
                    {(r.pickupDate || r.dropoffDate) && (
                      <Typography variant="body2" color="text.secondary">
                        {r.pickupDate ?? "—"} {r.pickupTime ?? ""} → {r.dropoffDate ?? "—"} {r.dropoffTime ?? ""}
                      </Typography>
                    )}
                    <Typography variant="body2" sx={{ mt: 0.5 }}>
                      {money(r.dailyPrice)}/día · {r.billedDays} días · Total {money(r.estimatedTotal)}
                      {r.reservationDeposit > 0 ? ` · Depósito ${money(r.reservationDeposit)}` : ""}
                    </Typography>
                  </Box>

                  <Stack spacing={1} sx={{ minWidth: 200 }}>
                    {/* State changes happen inside "Ver reserva" (expediente),
                        forcing a review of data + proof before deciding. */}
                    <Button
                      size="small"
                      variant="contained"
                      startIcon={<VisibilityRoundedIcon />}
                      onClick={() => router.push(`/admin/reservations/${r.id}`)}
                    >
                      Ver reserva
                    </Button>
                    <Box sx={{ display: "flex", gap: 1 }}>
                      <Button
                        size="small"
                        variant="outlined"
                        color="secondary"
                        startIcon={<ContentCopyRoundedIcon />}
                        onClick={() => copyUrl(`${window.location.origin}/reservar/${r.token}`)}
                        sx={{ flexGrow: 1 }}
                      >
                        Copiar enlace
                      </Button>
                      {canEdit && (
                        <IconButton aria-label="Eliminar" onClick={() => setDeleteTarget(r)}>
                          <DeleteOutlineRoundedIcon fontSize="small" />
                        </IconButton>
                      )}
                    </Box>
                  </Stack>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      {/* Create link dialog */}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Crear enlace de reserva</DialogTitle>
        <DialogContent>
          {formError && (
            <Alert severity="error" sx={{ mb: 2, mt: 1 }}>
              {formError}
            </Alert>
          )}

          {createdUrl ? (
            <Box sx={{ mt: 1 }}>
              <Alert severity="success" sx={{ mb: 2 }}>
                Enlace creado ({createdCode}). Cópialo y envíalo al cliente. No bloquea el vehículo ni
                confirma la reserva.
              </Alert>
              <TextField
                fullWidth
                value={createdUrl}
                slotProps={{ input: { readOnly: true } }}
                label="Enlace de reserva"
              />
              <Button
                sx={{ mt: 1.5 }}
                variant="contained"
                startIcon={<ContentCopyRoundedIcon />}
                onClick={() => copyUrl(createdUrl)}
              >
                Copiar enlace
              </Button>
            </Box>
          ) : (
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  select
                  fullWidth
                  label="Vehículo"
                  value={form.vehicleId}
                  onChange={(e) => onVehicleChange(e.target.value)}
                >
                  {vehicles.map((v) => (
                    <MenuItem key={v.id} value={v.id}>
                      {v.label} — {money(v.dailyPrice)}/día
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  select
                  fullWidth
                  label="Origen"
                  value={form.source}
                  onChange={(e) => setField("source", e.target.value)}
                >
                  {ADMIN_SOURCE_OPTIONS.map((s) => (
                    <MenuItem key={s} value={s}>
                      {RESERVATION_SOURCE_LABELS[s]}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Divider>
                  <Typography variant="caption" color="text.secondary">
                    Precarga opcional
                  </Typography>
                </Divider>
              </Grid>

              <Grid size={{ xs: 6 }}>
                <TextField
                  type="date"
                  fullWidth
                  label="Fecha recogida"
                  value={form.pickupDate}
                  onChange={(e) => setField("pickupDate", e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField
                  type="time"
                  fullWidth
                  label="Hora recogida"
                  value={form.pickupTime}
                  onChange={(e) => setField("pickupTime", e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField
                  type="date"
                  fullWidth
                  label="Fecha devolución"
                  value={form.dropoffDate}
                  onChange={(e) => setField("dropoffDate", e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
              <Grid size={{ xs: 6 }}>
                <TextField
                  type="time"
                  fullWidth
                  label="Hora devolución"
                  value={form.dropoffTime}
                  onChange={(e) => setField("dropoffTime", e.target.value)}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Lugar de recogida"
                  value={form.pickupLocation}
                  onChange={(e) => setField("pickupLocation", e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Lugar de devolución"
                  value={form.dropoffLocation}
                  onChange={(e) => setField("dropoffLocation", e.target.value)}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  type="number"
                  fullWidth
                  label="Precio / día"
                  value={form.dailyPrice}
                  onChange={(e) => setField("dailyPrice", e.target.value)}
                  slotProps={{ input: { startAdornment: <InputAdornment position="start">US$</InputAdornment> } }}
                  helperText="El cliente elegirá el monto de depósito al completar el formulario."
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button color="secondary" onClick={() => setOpen(false)} disabled={saving}>
            {createdUrl ? "Cerrar" : "Cancelar"}
          </Button>
          {!createdUrl && (
            <Button variant="contained" onClick={submitCreate} disabled={saving || !form.vehicleId}>
              {saving ? "Creando..." : "Generar enlace"}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Eliminar reserva"
        description="Esta acción no se puede deshacer. ¿Continuar?"
        confirmLabel="Eliminar"
        confirmColor="error"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />

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
