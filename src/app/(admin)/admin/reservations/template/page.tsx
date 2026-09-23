import type { Metadata } from "next";
import PageHeader from "@/components/ui/PageHeader";
import AccessDenied from "@/components/admin/AccessDenied";
import ReservationTemplateEditor from "@/components/admin/reservation-template/ReservationTemplateEditor";
import { getEditableReservationTemplate } from "@/features/reservation-template/data";
import { getCurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/permissions";
import { emptyTemplate } from "@/features/reservation-template/types";
import { getCompanySettings } from "@/lib/branding";
import { listPreviewVehicles } from "@/features/reservation-template/preview-vehicles";

export const metadata: Metadata = { title: "Plantilla de reserva" };

export default async function ReservationTemplatePage() {
  const user = await getCurrentUser();
  if (!hasPermission(user, "reservations.settings")) return <AccessDenied />;

  const [template, company, previewVehicles] = await Promise.all([
    getEditableReservationTemplate(),
    getCompanySettings(),
    listPreviewVehicles(),
  ]);

  return (
    <>
      <PageHeader
        title="Plantilla de reserva"
        description="Diseña la confirmación de reserva que luego usará el sistema para generar los PDF."
      />
      <ReservationTemplateEditor
        initialDocument={template?.document ?? emptyTemplate()}
        initialName={template?.name ?? "Plantilla de reserva"}
        publishedExists={template?.status === "published"}
        logoUrl={company.logoUrl ?? undefined}
        previewVehicles={previewVehicles}
      />
    </>
  );
}
