import type { Metadata } from "next";
import PageHeader from "@/components/ui/PageHeader";
import AccessDenied from "@/components/admin/AccessDenied";
import ContentManager from "@/components/admin/content/ContentManager";
import { getCurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/permissions";
import {
  listRequirementsAdmin,
  listDeliveryLocationsAdmin,
  listFaqsAdmin,
  listReviewsAdmin,
  listInclusionsAdmin,
  listPoliciesAdmin,
} from "@/features/content/data";

export const metadata: Metadata = { title: "Contenido" };

export default async function ContentPage() {
  const user = await getCurrentUser();
  if (!hasPermission(user, "content.view")) return <AccessDenied />;

  const [requirements, deliveryLocations, faqs, reviews, inclusions, policies] = await Promise.all([
    listRequirementsAdmin(),
    listDeliveryLocationsAdmin(),
    listFaqsAdmin(),
    listReviewsAdmin(),
    listInclusionsAdmin(),
    listPoliciesAdmin(),
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
        inclusions={inclusions}
        policies={policies}
      />
    </>
  );
}
