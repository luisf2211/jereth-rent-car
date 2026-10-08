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
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";
import EmptyState from "@/components/ui/EmptyState";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import {
  createReservationLink,
  deleteReservation,
  finalizeReservation,
} from "@/features/reservations/actions";
import {
  RESERVATION_STATUS_LABELS,
  RESERVATION_SOURCE_LABELS,
  ADMIN_SOURCE_OPTIONS,
  type ReservationStatus,
} from "@/lib/validations/reservation";
import type { AdminReservation } from "@/features/reservations/data";
import { computeReservationOps, humanDateTime, type ReservationOps } from "@/utils/reservation-ops";

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
  // Finished rentals (terminal). Populated once the admin finalizes a reservation.
  finalizadas: ["finished"],
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
  finished: "default",
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

  const [finalizeTarget, setFinalizeTarget] = React.useState<AdminReservation | null>(null);

  // ---- Operational signals (COMPUTED, never persisted) ----
  // Each reservation gets a derived phase + badges + sort key from its stored
  // dates and status, in the DR operational timezone (America/Santo_Domingo).
  // We compute once per render against a single "now" so the whole list is
  // consistent across the midnight boundary.
  const opsById = React.useMemo(() => {
    const now = new Date();
    const map = new Map<string, ReservationOps>();
    for (const r of reservations) map.set(r.id, computeReservationOps(r, now));
    return map;
    // Recompute when the list identity changes (after router.refresh()).
  }, [reservations]);

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

  // ---- Quick-filter predicates (SINGLE SOURCE OF TRUTH) ----
  // These are the EXACT per-reservation conditions behind each summary counter.
  // Both the counters and the clickable quick-filter reuse the same predicates,
  // so the number on a card always matches the filtered list.
  type QuickFilter = "needsAction" | "pickupsToday" | "inProgress" | "dropoffsToday";
  const quickPredicates: Record<QuickFilter, (r: AdminReservation) => boolean> = React.useMemo(
    () => ({
      needsAction: (r) => opsById.get(r.id)?.phase === "needs_action",
      inProgress: (r) => opsById.get(r.id)?.phase === "in_progress",
      // "Entregas hoy": a confirmed reservation whose pickup badge is HOY.
      pickupsToday: (r) => {
        const ops = opsById.get(r.id);
        return ops?.phase === "upcoming" && ops.badges.some((b) => b.label === "HOY");
      },
      // "Devoluciones hoy": reservations returning today.
      dropoffsToday: (r) => Boolean(opsById.get(r.id)?.badges.some((b) => b.label === "DEVOLUCIÓN HOY")),
    }),
    [opsById],
  );

  // ---- Operational summary counters (computed from the SAME predicates) ----
  const summary = React.useMemo(
    () => ({
      needsAction: reservations.filter(quickPredicates.needsAction).length,
      pickupsToday: reservations.filter(quickPredicates.pickupsToday).length,
      inProgress: reservations.filter(quickPredicates.inProgress).length,
      dropoffsToday: reservations.filter(quickPredicates.dropoffsToday).length,
    }),
    [reservations, quickPredicates],
  );

  // Active quick filter (null = none). Clicking a card toggles it; clicking the
  // active card again clears it. It is independent from the tabs: tabs keep
  // working as before, and the quick filter refines the current view.
  const [quickFilter, setQuickFilter] = React.useState<QuickFilter | null>(null);
  const toggleQuickFilter = (q: QuickFilter) => setQuickFilter((cur) => (cur === q ? null : q));

  // Smart order + filtering:
  //  - When a quick filter is ACTIVE, the list shows EXACTLY the reservations
  //    behind that counter (same predicate, applied over all reservations), so
  //    the card number always matches the rows shown.
  //  - When NO quick filter is active, the list is filtered by the active tab
  //    (unchanged tab behaviour).
  // Then sort by the computed operational sort key (needs-action first, then
  // overdue, in-progress, upcoming by soonest pickup, closed last). Stable:
  // ties keep the data-layer order.
  const visible = React.useMemo(() => {
    const base = quickFilter
      ? reservations.filter(quickPredicates[quickFilter])
      : reservations.filter((r) => inTab(r, tab));
    return base
      .map((r, i) => ({ r, i, key: opsById.get(r.id)?.sortKey ?? 5_000_000 }))
      .sort((a, b) => a.key - b.key || a.i - b.i)
      .map(({ r }) => r);
  }, [reservations, tab, opsById, quickFilter, quickPredicates]);

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

  // Finalizing an overdue rental: confirmed → finished via the server action.
  // The confirmation dialog gates the action; `finalizing` guards against a
  // double click while the request is in flight.
  const [finalizing, setFinalizing] = React.useState(false);
  const confirmFinalize = async () => {
    if (!finalizeTarget || finalizing) return;
    setFinalizing(true);
    const res = await finalizeReservation(finalizeTarget.id);
    setFinalizing(false);
    setFinalizeTarget(null);
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

      {/* Operational summary — compact counters computed from the derived
          phase. Each card is a QUICK FILTER: clicking it shows exactly the
          reservations behind that counter (same predicate), and clicking the
          active card again clears the filter. The active card gets a discreet
          "filtro activo" visual state. */}
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        {[
          { key: "needsAction" as QuickFilter, label: "Requieren atención", value: summary.needsAction, color: "warning.main" },
          { key: "pickupsToday" as QuickFilter, label: "Entregas hoy", value: summary.pickupsToday, color: "info.main" },
          { key: "inProgress" as QuickFilter, label: "En curso", value: summary.inProgress, color: "success.main" },
          { key: "dropoffsToday" as QuickFilter, label: "Devoluciones hoy", value: summary.dropoffsToday, color: "error.main" },
        ].map((c) => {
          const active = quickFilter === c.key;
          return (
            <Grid key={c.label} size={{ xs: 6, md: 3 }}>
              <Card
                onClick={() => toggleQuickFilter(c.key)}
                role="button"
                aria-pressed={active}
                sx={{
                  cursor: "pointer",
                  transition: "box-shadow 0.15s, border-color 0.15s, background-color 0.15s",
                  borderLeft: "4px solid",
                  borderLeftColor: c.color,
                  // Discreet active state: subtle outline + tint, same layout.
                  outline: active ? "2px solid" : "none",
                  outlineColor: active ? c.color : "transparent",
                  bgcolor: active ? "action.selected" : "background.paper",
                  "&:hover": { boxShadow: 3 },
                }}
              >
                <CardContent sx={{ py: 1.5, "&:last-child": { pb: 1.5 } }}>
                  <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.1 }}>
                    {c.value}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {c.label}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          );
        })}
      </Grid>

      {/* Tabs / filters */}
      <Card sx={{ mb: 2 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => {
            // Switching tab clears the quick filter so the two don't conflict;
            // tab behaviour itself is unchanged.
            setQuickFilter(null);
            setTab(v as ReservationTab);
          }}
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
        <EmptyState title={quickFilter ? "No hay reservas en este filtro rápido." : "No hay reservas en esta categoría."} />
      ) : (
        <Stack spacing={1.5}>
          {visible.map((r) => {
            const ops = opsById.get(r.id);
            const customer = r.customerName?.trim() || "Sin datos del cliente todavía";
            const hasCustomer = Boolean(r.customerName?.trim());
            // Overdue rentals get a stronger visual priority (left accent bar).
            const highlight = ops?.phase === "pending_finalize";
            return (
              <Card
                key={r.id}
                sx={
                  highlight
                    ? { borderLeft: "4px solid", borderLeftColor: "error.main" }
                    : undefined
                }
              >
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
                      {/* PRIMARY: customer name, large + bold. */}
                      <Typography
                        variant="h6"
                        sx={{ fontWeight: 800, lineHeight: 1.2, color: hasCustomer ? "text.primary" : "text.secondary" }}
                      >
                        {customer}
                      </Typography>

                      {/* Badges — consistent hierarchy:
                          1) REAL status, 2) computed operational indicators,
                          3) the rest (origin, deposit, special request, flight). */}
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap", mt: 0.75, mb: 0.5 }}>
                        {/* 1) Current status (label only — no changing from the list). */}
                        <Chip
                          label={RESERVATION_STATUS_LABELS[r.status]}
                          size="small"
                          color={STATUS_COLOR[r.status]}
                        />
                        {/* 2) COMPUTED operational indicators. */}
                        {ops?.badges.map((b) => (
                          <Chip key={b.label} label={b.label} size="small" color={b.color} variant={b.variant} />
                        ))}
                        {/* 3) Origin. */}
                        <Chip label={RESERVATION_SOURCE_LABELS[r.source]} size="small" variant="outlined" />
                        {/* 3) Deposit indicator (money received). */}
                        <Chip
                          label={r.depositPaid > 0 ? `Con depósito · ${money(r.depositPaid)}` : "Sin depósito"}
                          size="small"
                          color={r.depositPaid > 0 ? "success" : "default"}
                          variant={r.depositPaid > 0 ? "filled" : "outlined"}
                        />
                        {r.specialRequest && <Chip label="⚠ Solicitud especial" size="small" color="warning" />}
                        {(r.flight.hasArrivalFlight || r.flight.hasReturnFlight) && (
                          <Chip label="✈ Vuelo registrado" size="small" variant="outlined" color="info" />
                        )}
                      </Box>

                      {/* SECONDARY: reservation code, de-emphasized. */}
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: 0.3 }}>
                        {r.code}
                      </Typography>

                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {r.vehicleTitle}
                        {r.phone ? ` · ${r.phone}` : ""}
                      </Typography>
                      {/* Human-friendly dates (presentation only): es, 12h AM/PM, RD. */}
                      {(r.pickupDate || r.dropoffDate) && (
                        <Box sx={{ mt: 0.25 }}>
                          <Typography variant="body2" color="text.secondary">
                            Recogida: {humanDateTime(r.pickupDate, r.pickupTime)}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Devolución: {humanDateTime(r.dropoffDate, r.dropoffTime)}
                          </Typography>
                        </Box>
                      )}
                      <Typography variant="body2" sx={{ mt: 0.5 }}>
                        {money(r.dailyPrice)}/día · {r.billedDays} días · Total {money(r.estimatedTotal)}
                        {r.reservationDeposit > 0 ? ` · Depósito ${money(r.reservationDeposit)}` : ""}
                      </Typography>
                    </Box>

                    <Stack spacing={1} sx={{ minWidth: 200 }}>
                      {/* Finalize (only for overdue confirmed rentals). Asks for
                          confirmation; uses no duplicated state logic. */}
                      {canEdit && ops?.pendingFinalize && (
                        <Button
                          size="small"
                          variant="contained"
                          color="error"
                          startIcon={<TaskAltRoundedIcon />}
                          onClick={() => setFinalizeTarget(r)}
                        >
                          Finalizar reserva
                        </Button>
                      )}
                      {/* State changes happen inside "Ver reserva" (expediente),
                          forcing a review of data + proof before deciding. */}
                      <Button
                        size="small"
                        variant={ops?.pendingFinalize ? "outlined" : "contained"}
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
            );
          })}
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

      <ConfirmDialog
        open={Boolean(finalizeTarget)}
        title="Finalizar reserva"
        description={
          finalizeTarget
            ? `¿Confirmas que la renta de ${finalizeTarget.customerName?.trim() || finalizeTarget.code} (${finalizeTarget.code}) ya fue devuelta y deseas finalizarla? La reserva se mantendrá confirmada hasta que esta acción se habilite.`
            : ""
        }
        confirmLabel="Finalizar"
        confirmColor="error"
        onConfirm={confirmFinalize}
        onCancel={() => setFinalizeTarget(null)}
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
