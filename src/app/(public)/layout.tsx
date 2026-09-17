import * as React from "react";
import Box from "@mui/material/Box";
import PublicHeader from "@/components/public/PublicHeader";
import PublicFooter from "@/components/public/PublicFooter";
import { getCompanySettings } from "@/lib/branding";

/**
 * Layout for the customer-facing portal.
 * Header + page content + footer. Reads branding from the central source.
 */
export default function PublicLayout({ children }: LayoutProps<"/">) {
  const { whatsappNumber } = getCompanySettings();

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100dvh" }}>
      <PublicHeader whatsappNumber={whatsappNumber} />
      <Box component="main" sx={{ flexGrow: 1 }}>
        {children}
      </Box>
      <PublicFooter />
    </Box>
  );
}
