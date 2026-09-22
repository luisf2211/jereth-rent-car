import type { Metadata } from "next";
import Button from "@mui/material/Button";
import SettingsRoundedIcon from "@mui/icons-material/SettingsRounded";
import PageHeader from "@/components/ui/PageHeader";
import AccessDenied from "@/components/admin/AccessDenied";
import ReservationsManager from "@/components/admin/reservations/ReservationsManager";
import { getCurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/permissions";
import { listReservationsAdmin, getReservationSettings } from "@/features/reservations/data";
import { listAllVehicles } from "@/features/vehicles/admin-data";

export const metadata: Metadata = { title: "Reservas" };

export default async function ReservationsPage() {
  const user = await getCurrentUser();
  if (!hasPermission(user, "reservations.view")) return <AccessDenied />;

  const canEdit = hasPermission(user, "reservations.edit");
  const canConfigure = hasPermission(user, "reservations.settings");

  const [reservations, vehicles, settings] = await Promise.all([
    listReservationsAdmin(),
    listAllVehicles(),
    getReservationSettings(),
  ]);

  // Minimal vehicle options for the "create link" picker.
  const vehicleOptions = vehicles.map((v) => ({
    id: v.id,
    label: `${v.brand} ${v.model} ${v.year}`,
    dailyPrice: v.dailyPrice,
  }));

  return (
    <>
      <PageHeader
        title="Reservas"
        description="Gestiona las reservas digitales y crea enlaces para enviar a tus clientes. Crear un enlace no bloquea el vehículo ni confirma la reserva."
        action={
          canConfigure ? (
            <Button
              href="/admin/reservations/settings"
              variant="outlined"
              color="secondary"
              startIcon={<SettingsRoundedIcon />}
            >
              Configuración
            </Button>
          ) : undefined
        }
      />
      <ReservationsManager
        reservations={reservations}
        vehicles={vehicleOptions}
        defaultDeposit={settings.defaultDeposit}
        canEdit={canEdit}
      />
    </>
  );
}
