import * as React from "react";
import Image from "next/image";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import HourglassTopRoundedIcon from "@mui/icons-material/HourglassTopRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CancelRoundedIcon from "@mui/icons-material/CancelRounded";
import BlockRoundedIcon from "@mui/icons-material/BlockRounded";
import EditNoteRoundedIcon from "@mui/icons-material/EditNoteRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import { RESERVATION_STATUS_LABELS, type ReservationStatus } from "@/lib/validations/reservation";
import type { ReservationFormData } from "@/features/reservations/data";
import ReservationShareActions from "./ReservationShareActions";

function money(n: number) {
  return `US$${n.toLocaleString("en-US")}`;
}

/** Customer-facing presentation for each status (no internal admin data). */
const STATUS_VIEW: Record<
  ReservationStatus,
  { title: string; description: string; color: "info" | "warning" | "success" | "error"; icon: React.ReactNode }
> = {
  link_created: {
    title: "Reserva iniciada",
    description: "Completa el formulario para enviar tu solicitud.",
    color: "info",
    icon: <EditNoteRoundedIcon />,
  },
  pending: {
    title: "Pendiente de verificación",
    description:
      "Hemos recibido tu solicitud. Nuestro equipo está revisando la información. Recibirás una respuesta dentro de un plazo de 0 a 24 horas.",
    color: "warning",
    icon: <HourglassTopRoundedIcon />,
  },
  confirmed: {
    title: "Reserva confirmada",
    description: "¡Tu reserva está confirmada! Te esperamos. Cualquier duda, contáctanos.",
    color: "success",
    icon: <CheckCircleRoundedIcon />,
  },
  needs_fix: {
    title: "Requiere corrección",
    description: "Necesitamos que revises algunos datos de tu reserva.",
    color: "warning",
    icon: <EditNoteRoundedIcon />,
  },
  rejected: {
    title: "Solicitud no aprobada",
    description:
      "Lamentablemente no pudimos aprobar esta solicitud. Puedes contactar a JERETH RENT CAR para más información.",
    color: "error",
    icon: <BlockRoundedIcon />,
  },
  cancelled: {
    title: "Reserva cancelada",
    description: "Esta reserva ha sido cancelada. Si crees que es un error, contáctanos.",
    color: "error",
    icon: <CancelRoundedIcon />,
  },
};

/** A labelled read-only line. */
function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2, py: 0.4 }}>
      <Typography variant="body2" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body2" sx={{ fontWeight: strong ? 700 : 500, textAlign: "right" }}>
        {value}
      </Typography>
    </Box>
  );
}

/**
 * Customer tracking view shown once the reservation has been submitted. Shows
 * only customer-relevant info (no admin internals). The same URL renders this
 * and updates as the admin changes the status.
 */
export default function ReservationTracking({ reservation: r }: { reservation: ReservationFormData }) {
  const view = STATUS_VIEW[r.status];
  const pickup = [r.pickupDate, r.pickupTime].filter(Boolean).join(" ");
  const dropoff = [r.dropoffDate, r.dropoffTime].filter(Boolean).join(" ");

  // Only show the admin's message to the customer when it was marked visible.
  const showMessage = r.statusMessageVisible && Boolean(r.statusMessage);

  return (
    <Stack spacing={3}>
      {/* Status banner */}
      <Card>
        <CardContent sx={{ textAlign: "center", py: { xs: 4, md: 5 } }}>
          <Box sx={{ color: `${view.color}.main`, "& svg": { fontSize: 56 }, mb: 1 }}>{view.icon}</Box>
          <Chip label={RESERVATION_STATUS_LABELS[r.status]} color={view.color} sx={{ mb: 2, fontWeight: 700 }} />
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
            {view.title}
          </Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 520, mx: "auto", lineHeight: 1.7 }}>
            {view.description}
          </Typography>

          {/* Admin message (only if marked visible) */}
          {showMessage && (
            <Alert severity={r.status === "rejected" ? "error" : "warning"} sx={{ mt: 2.5, textAlign: "left", maxWidth: 520, mx: "auto" }}>
              {r.statusMessage}
            </Alert>
          )}

          {/* Correction CTA */}
          {r.status === "needs_fix" && (
            <Box sx={{ mt: 3 }}>
              <Button
                href="?corregir=1"
                variant="contained"
                startIcon={<EditRoundedIcon />}
              >
                Corregir información
              </Button>
            </Box>
          )}

          {/* Confirmation PDF download (once confirmed) */}
          {r.status === "confirmed" && r.confirmationPdfUrl && (
            <Box sx={{ mt: 3 }}>
              <Button
                href={r.confirmationPdfUrl}
                target="_blank"
                rel="noopener noreferrer"
                variant="contained"
                color="success"
                startIcon={<DownloadRoundedIcon />}
              >
                Descargar confirmación PDF
              </Button>
            </Box>
          )}

          <Box
            sx={{
              display: "inline-block",
              mt: 3,
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
              {r.code}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      {/* Save / share link */}
      <ReservationShareActions code={r.code} />

      {/* Vehicle + details */}
      <Card>
        <CardContent>
          <Box sx={{ display: "flex", gap: 2, alignItems: "center", mb: 2 }}>
            <Box sx={{ position: "relative", width: 120, height: 84, borderRadius: 2, overflow: "hidden", flexShrink: 0, bgcolor: "grey.100" }}>
              <Image src={r.vehicleImageUrl} alt={r.vehicleTitle} fill sizes="120px" style={{ objectFit: "cover" }} />
            </Box>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                {r.vehicleTitle}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {money(r.dailyPrice)} / día
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ mb: 1.5 }} />

          <Row label="Recogida" value={pickup || "—"} />
          <Row label="Devolución" value={dropoff || "—"} />
          <Row label="Lugar de recogida" value={r.pickupLocation || "—"} />
          <Row label="Lugar de devolución" value={r.dropoffLocation || "—"} />
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
            Resumen de pago
          </Typography>
          <Row label={`Renta (${r.billedDays} ${r.billedDays === 1 ? "día" : "días"})`} value={money(r.subtotalRent)} />
          {r.pickupFee > 0 && <Row label="Cargo de entrega (recogida)" value={money(r.pickupFee)} />}
          {r.dropoffFee > 0 && <Row label="Cargo de entrega (devolución)" value={money(r.dropoffFee)} />}
          <Divider sx={{ my: 1 }} />
          <Row label="Total" value={money(r.estimatedTotal)} strong />
          <Row label="Monto reservado" value={money(r.depositPaid)} />
          <Row label="Saldo pendiente" value={money(r.balanceDue)} strong />
        </CardContent>
      </Card>

      {r.status === "pending" && (
        <Alert severity="info">
          Guarda este enlace: puedes volver a abrirlo en cualquier momento para consultar el estado
          de tu reserva.
        </Alert>
      )}
    </Stack>
  );
}
