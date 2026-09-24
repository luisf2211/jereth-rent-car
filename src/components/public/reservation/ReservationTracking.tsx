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
import { type ReservationStatus } from "@/lib/validations/reservation";
import type { ReservationFormData } from "@/features/reservations/data";
import { getI18n } from "@/i18n/server";
import type { TFunction } from "@/i18n/translate";
import ReservationShareActions from "./ReservationShareActions";

function money(n: number) {
  return `US$${n.toLocaleString("en-US")}`;
}

/**
 * Customer-facing presentation for each status. The visual attributes (color,
 * icon) are static; the title/description come from the dictionary via the
 * status.* keys, and the status chip label from status.label_*.
 */
const STATUS_META: Record<
  ReservationStatus,
  { titleKey: string; descKey: string; labelKey: string; color: "info" | "warning" | "success" | "error"; icon: React.ReactNode }
> = {
  link_created: {
    titleKey: "status.link_created_title",
    descKey: "status.link_created_desc",
    labelKey: "status.label_link_created",
    color: "info",
    icon: <EditNoteRoundedIcon />,
  },
  pending: {
    titleKey: "status.pending_title",
    descKey: "status.pending_desc",
    labelKey: "status.label_pending",
    color: "warning",
    icon: <HourglassTopRoundedIcon />,
  },
  confirmed: {
    titleKey: "status.confirmed_title",
    descKey: "status.confirmed_desc",
    labelKey: "status.label_confirmed",
    color: "success",
    icon: <CheckCircleRoundedIcon />,
  },
  needs_fix: {
    titleKey: "status.needs_fix_title",
    descKey: "status.needs_fix_desc",
    labelKey: "status.label_needs_fix",
    color: "warning",
    icon: <EditNoteRoundedIcon />,
  },
  rejected: {
    titleKey: "status.rejected_title",
    descKey: "status.rejected_desc",
    labelKey: "status.label_rejected",
    color: "error",
    icon: <BlockRoundedIcon />,
  },
  cancelled: {
    titleKey: "status.cancelled_title",
    descKey: "status.cancelled_desc",
    labelKey: "status.label_cancelled",
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
export default async function ReservationTracking({ reservation: r }: { reservation: ReservationFormData }) {
  const { t } = await getI18n();
  const meta = STATUS_META[r.status];
  const pickup = [r.pickupDate, r.pickupTime].filter(Boolean).join(" ");
  const dropoff = [r.dropoffDate, r.dropoffTime].filter(Boolean).join(" ");

  // Only show the admin's message to the customer when it was marked visible.
  const showMessage = r.statusMessageVisible && Boolean(r.statusMessage);

  return (
    <Stack spacing={3}>
      {/* Status banner */}
      <Card>
        <CardContent sx={{ textAlign: "center", py: { xs: 4, md: 5 } }}>
          <Box sx={{ color: `${meta.color}.main`, "& svg": { fontSize: 56 }, mb: 1 }}>{meta.icon}</Box>
          <Chip label={t(meta.labelKey)} color={meta.color} sx={{ mb: 2, fontWeight: 700 }} />
          <Typography variant="h5" sx={{ fontWeight: 800, mb: 1 }}>
            {t(meta.titleKey)}
          </Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 520, mx: "auto", lineHeight: 1.7 }}>
            {t(meta.descKey)}
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
                {t("tracking.correctInfo")}
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
                {t("tracking.downloadPdf")}
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
              {t("tracking.reservationNumber")}
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
                {money(r.dailyPrice)} {t("common.perDay")}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ mb: 1.5 }} />

          <Row label={t("tracking.pickup")} value={pickup || "—"} />
          <Row label={t("tracking.dropoff")} value={dropoff || "—"} />
          <Row label={t("tracking.pickupLocation")} value={r.pickupLocation || "—"} />
          <Row label={t("tracking.dropoffLocation")} value={r.dropoffLocation || "—"} />
        </CardContent>
      </Card>

      {/* Pricing */}
      <Card>
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
            {t("tracking.paymentSummary")}
          </Typography>
          <Row
            label={t("tracking.rentDays", {
              n: r.billedDays,
              unit: r.billedDays === 1 ? t("tracking.dayUnitOne") : t("tracking.dayUnitMany"),
            })}
            value={money(r.subtotalRent)}
          />
          {r.pickupFee > 0 && <Row label={t("booking.pickupFee")} value={money(r.pickupFee)} />}
          {r.dropoffFee > 0 && <Row label={t("booking.dropoffFee")} value={money(r.dropoffFee)} />}
          <Divider sx={{ my: 1 }} />
          <Row label={t("tracking.total")} value={money(r.estimatedTotal)} strong />
          <Row label={t("tracking.reservedAmount")} value={money(r.depositPaid)} />
          <Row label={t("tracking.balanceDue")} value={money(r.balanceDue)} strong />
        </CardContent>
      </Card>

      {r.status === "pending" && (
        <Alert severity="info">
          {t("tracking.saveLinkNote")}
        </Alert>
      )}
    </Stack>
  );
}
