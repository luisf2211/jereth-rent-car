import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Button from "@mui/material/Button";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import PageHeader from "@/components/ui/PageHeader";
import AccessDenied from "@/components/admin/AccessDenied";
import ReservationDetail from "@/components/admin/reservations/ReservationDetail";
import { getCurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/permissions";
import { getReservationById } from "@/features/reservations/data";

export const metadata: Metadata = { title: "Detalle de reserva" };

export default async function ReservationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const user = await getCurrentUser();
  if (!hasPermission(user, "reservations.view")) return <AccessDenied />;

  const canEdit = hasPermission(user, "reservations.edit");
  const reservation = await getReservationById(id);
  if (!reservation) notFound();

  return (
    <>
      <PageHeader
        title={`Reserva ${reservation.code}`}
        description="Expediente completo de la reserva. Revisa los datos y el comprobante antes de confirmar o rechazar."
        action={
          <Button
            href="/admin/reservations"
            variant="outlined"
            color="secondary"
            startIcon={<ArrowBackRoundedIcon />}
          >
            Volver a reservas
          </Button>
        }
      />
      <ReservationDetail reservation={reservation} canEdit={canEdit} />
    </>
  );
}
