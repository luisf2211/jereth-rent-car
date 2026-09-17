import type { Metadata } from "next";
import Button from "@mui/material/Button";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import PageHeader from "@/components/ui/PageHeader";
import VehiclesAdminList from "@/components/admin/vehicles/VehiclesAdminList";
import { listAllVehicles } from "@/features/vehicles/admin-data";

export const metadata: Metadata = { title: "Vehículos" };

export default async function VehiclesAdminPage() {
  const vehicles = await listAllVehicles();

  return (
    <>
      <PageHeader
        title="Vehículos"
        description="Administra el catálogo de vehículos de tu flota."
        action={
          <Button href="/admin/vehicles/new" variant="contained" startIcon={<AddRoundedIcon />}>
            Nuevo vehículo
          </Button>
        }
      />
      <VehiclesAdminList vehicles={vehicles} />
    </>
  );
}
