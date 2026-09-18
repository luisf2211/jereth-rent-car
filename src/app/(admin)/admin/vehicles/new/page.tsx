import type { Metadata } from "next";
import PageHeader from "@/components/ui/PageHeader";
import AccessDenied from "@/components/admin/AccessDenied";
import VehicleForm from "@/components/admin/vehicles/VehicleForm";
import { listUsedFeatures } from "@/features/vehicles/admin-data";
import { getCurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/permissions";

export const metadata: Metadata = { title: "Nuevo vehículo" };

export default async function NewVehiclePage() {
  const user = await getCurrentUser();
  if (!hasPermission(user, "vehicles.create")) return <AccessDenied />;

  const featureSuggestions = await listUsedFeatures();

  return (
    <>
      <PageHeader title="Nuevo vehículo" description="Agrega un vehículo a tu flota." />
      <VehicleForm featureSuggestions={featureSuggestions} />
    </>
  );
}
