import type { Metadata } from "next";
import PageHeader from "@/components/ui/PageHeader";
import VehicleForm from "@/components/admin/vehicles/VehicleForm";

export const metadata: Metadata = { title: "Nuevo vehículo" };

export default function NewVehiclePage() {
  return (
    <>
      <PageHeader title="Nuevo vehículo" description="Agrega un vehículo a tu flota." />
      <VehicleForm />
    </>
  );
}
