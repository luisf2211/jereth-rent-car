import * as React from "react";
import Box from "@mui/material/Box";
import PublicHeader from "@/components/public/PublicHeader";
import PublicFooter from "@/components/public/PublicFooter";
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
        <Box component="main" sx={{ flexGrow: 1 }}>
          {children}
        </Box>
        <PublicFooter settings={settings} />
      </Box>
    </BrandingProvider>
  );
}
