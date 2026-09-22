import type { Metadata } from "next";
import PageHeader from "@/components/ui/PageHeader";
import AccessDenied from "@/components/admin/AccessDenied";
import ReservationSettingsForm from "@/components/admin/reservations/ReservationSettingsForm";
import { getCurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/permissions";
import { getReservationSettings } from "@/features/reservations/data";

export const metadata: Metadata = { title: "Configuración de reservas" };

export default async function ReservationSettingsPage() {
  const user = await getCurrentUser();
  if (!hasPermission(user, "reservations.settings")) return <AccessDenied />;

  const canEdit = hasPermission(user, "reservations.settings");
  const initial = await getReservationSettings();

  return (
    <>
      <PageHeader
        title="Configuración de reservas"
        description="Activa el proceso digital y define los métodos de pago que verá el cliente. Mientras esté desactivado, el sitio mantiene el flujo actual de WhatsApp."
      />
      <ReservationSettingsForm initial={initial} canEdit={canEdit} />
    </>
  );
}
