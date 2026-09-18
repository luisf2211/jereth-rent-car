import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PageHeader from "@/components/ui/PageHeader";
import VehicleForm from "@/components/admin/vehicles/VehicleForm";
import { getVehicleForAdmin } from "@/features/vehicles/admin-data";
import { vehicleTitleWithYear } from "@/features/vehicles/format";

export const metadata: Metadata = { title: "Editar vehículo" };

export default async function EditVehiclePage({ params }: PageProps<"/admin/vehicles/[id]">) {
  const { id } = await params;
  const vehicle = await getVehicleForAdmin(id);

  if (!vehicle) {
    notFound();
  }

  return (
    <>
      <PageHeader title="Editar vehículo" description={vehicleTitleWithYear(vehicle)} />
      <VehicleForm vehicle={vehicle} />
    </>
  );
}
