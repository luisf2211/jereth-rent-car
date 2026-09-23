import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Button from "@mui/material/Button";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import PageHeader from "@/components/ui/PageHeader";
import AccessDenied from "@/components/admin/AccessDenied";
import VehicleForm from "@/components/admin/vehicles/VehicleForm";
import { getVehicleForAdmin, listUsedFeatures } from "@/features/vehicles/admin-data";
import { vehicleTitleWithYear } from "@/features/vehicles/format";
import { getCurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/permissions";

export const metadata: Metadata = { title: "Editar vehículo" };

export default async function EditVehiclePage({ params }: PageProps<"/admin/vehicles/[id]">) {
  const user = await getCurrentUser();
  if (!hasPermission(user, "vehicles.edit")) return <AccessDenied />;

  const { id } = await params;
  const [vehicle, featureSuggestions] = await Promise.all([
    getVehicleForAdmin(id),
    listUsedFeatures(),
  ]);

  if (!vehicle) {
    notFound();
  }

  return (
    <>
      <Button
        href="/admin/vehicles"
        startIcon={<ArrowBackRoundedIcon />}
        color="secondary"
        sx={{ mb: 1 }}
      >
        Volver a vehículos
      </Button>
      <PageHeader title="Editar vehículo" description={vehicleTitleWithYear(vehicle)} />
      <VehicleForm vehicle={vehicle} featureSuggestions={featureSuggestions} />
    </>
  );
}
