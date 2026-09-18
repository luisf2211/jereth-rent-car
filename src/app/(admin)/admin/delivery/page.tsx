import type { Metadata } from "next";
import PageHeader from "@/components/ui/PageHeader";
import AccessDenied from "@/components/admin/AccessDenied";
import DeliveryManager from "@/components/admin/delivery/DeliveryManager";
import { getCurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/permissions";
import { listDeliveryLocationsAdmin } from "@/features/delivery-locations/data";

export const metadata: Metadata = { title: "Lugares de entrega" };

export default async function DeliveryPage() {
  const user = await getCurrentUser();
  if (!hasPermission(user, "delivery.view")) return <AccessDenied />;

  const locations = await listDeliveryLocationsAdmin();

  return (
    <>
      <PageHeader
        title="Lugares de entrega"
        description="Define dónde entregas y recibes los vehículos. Cada lugar puede tener su propio cargo de entrega, que se suma al total de la reserva cuando el cliente lo elige."
      />
      <DeliveryManager locations={locations} />
    </>
  );
}
