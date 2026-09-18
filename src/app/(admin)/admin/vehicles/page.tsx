import type { Metadata } from "next";
import Button from "@mui/material/Button";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import PageHeader from "@/components/ui/PageHeader";
import AccessDenied from "@/components/admin/AccessDenied";
import VehiclesAdminList from "@/components/admin/vehicles/VehiclesAdminList";
import { listAllVehicles } from "@/features/vehicles/admin-data";
import { getCurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/permissions";

export const metadata: Metadata = { title: "Vehículos" };

export default async function VehiclesAdminPage() {
  const user = await getCurrentUser();
  if (!hasPermission(user, "vehicles.view")) return <AccessDenied />;

  const canCreate = hasPermission(user, "vehicles.create");
  const canManage = hasPermission(user, "vehicles.edit") || hasPermission(user, "vehicles.disable");
  const vehicles = await listAllVehicles();

  return (
    <>
      <PageHeader
        title="Vehículos"
        description="Administra el catálogo de vehículos de tu flota."
        action={
          canCreate ? (
            <Button href="/admin/vehicles/new" variant="contained" startIcon={<AddRoundedIcon />}>
              Nuevo vehículo
            </Button>
          ) : undefined
        }
      />
      <VehiclesAdminList vehicles={vehicles} canManage={canManage} />
    </>
  );
}
