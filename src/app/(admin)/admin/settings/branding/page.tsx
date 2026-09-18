import type { Metadata } from "next";
import PageHeader from "@/components/ui/PageHeader";
import AccessDenied from "@/components/admin/AccessDenied";
import BrandingForm from "@/components/admin/branding/BrandingForm";
import { getBrandingFormData } from "@/features/branding/data";
import { getCurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/permissions";

export const metadata: Metadata = { title: "Branding" };

export default async function BrandingSettingsPage() {
  const user = await getCurrentUser();
  if (!hasPermission(user, "branding.view")) return <AccessDenied />;

  const canEdit = hasPermission(user, "branding.edit");
  const initial = await getBrandingFormData();

  return (
    <>
      <PageHeader
        title="Branding"
        description="Personaliza la identidad de tu Rent Car. Los cambios se reflejan en todo el sitio."
      />
      <BrandingForm initial={initial} canEdit={canEdit} />
    </>
  );
}
