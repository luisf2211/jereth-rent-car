import type { Metadata } from "next";
import PageHeader from "@/components/ui/PageHeader";
import BrandingForm from "@/components/admin/branding/BrandingForm";
import { getBrandingFormData } from "@/features/branding/data";

export const metadata: Metadata = { title: "Branding" };

export default async function BrandingSettingsPage() {
  const initial = await getBrandingFormData();

  return (
    <>
      <PageHeader
        title="Branding"
        description="Personaliza la identidad de tu Rent Car. Los cambios se reflejan en todo el sitio."
      />
      <BrandingForm initial={initial} />
    </>
  );
}
