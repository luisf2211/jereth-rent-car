import * as React from "react";
import Box from "@mui/material/Box";
import PublicHeader from "@/components/public/PublicHeader";
import PublicFooter from "@/components/public/PublicFooter";
import FloatingWhatsApp from "@/components/public/FloatingWhatsApp";
import { BrandingProvider } from "@/components/branding/BrandingProvider";
import { getCompanySettings } from "@/lib/branding";

/**
 * Layout for the customer-facing portal.
 * Fetches branding once and provides it to client components below.
 */
export default async function PublicLayout({ children }: LayoutProps<"/">) {
  const settings = await getCompanySettings();

  return (
    <BrandingProvider settings={settings}>
      <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100dvh" }}>
        <PublicHeader />
        {/*
          Header is fixed + transparent over the hero. Pages that open with the
          dark hero cancel this offset themselves (the hero has its own top
          padding); other pages get comfortable clearance via this spacing on
          the data attribute below.
        */}
        <Box component="main" sx={{ flexGrow: 1 }}>
          {children}
        </Box>
        <PublicFooter settings={settings} />
        <FloatingWhatsApp whatsappNumber={settings.whatsappNumber} />
      </Box>
    </BrandingProvider>
  );
}
