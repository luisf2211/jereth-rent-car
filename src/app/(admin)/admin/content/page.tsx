import type { Metadata } from "next";
import PageHeader from "@/components/ui/PageHeader";
import ContentManager from "@/components/admin/content/ContentManager";
import {
  listRequirementsAdmin,
  listDeliveryLocationsAdmin,
  listFaqsAdmin,
  listReviewsAdmin,
} from "@/features/content/data";

export const metadata: Metadata = { title: "Contenido" };

export default async function ContentPage() {
  const [requirements, deliveryLocations, faqs, reviews] = await Promise.all([
    listRequirementsAdmin(),
    listDeliveryLocationsAdmin(),
    listFaqsAdmin(),
    listReviewsAdmin(),
  ]);

  return (
    <>
      <PageHeader
        title="Contenido del sitio"
        description="Gestiona requisitos, lugares de entrega, preguntas frecuentes y reseñas. Solo se muestra en el sitio lo que agregues aquí."
      />
      <ContentManager
        requirements={requirements}
        deliveryLocations={deliveryLocations}
        faqs={faqs}
        reviews={reviews}
      />
    </>
  );
}
