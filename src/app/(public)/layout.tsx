import * as React from "react";
import Box from "@mui/material/Box";
import PublicHeader from "@/components/public/PublicHeader";
import PublicFooter from "@/components/public/PublicFooter";
import FloatingWhatsApp from "@/components/public/FloatingWhatsApp";
import { BrandingProvider } from "@/components/branding/BrandingProvider";
import { LanguageProvider } from "@/i18n/LanguageProvider";
import { getCompanySettings } from "@/lib/branding";
import { getServerLocale, getDictionary } from "@/i18n/server";

/**
 * Layout for the customer-facing portal.
 * Fetches branding + resolves the active locale once, then provides both to
 * client components below.
 */
export default async function PublicLayout({ children }: LayoutProps<"/">) {
  const settings = await getCompanySettings();
  const locale = await getServerLocale();
  const dict = await getDictionary(locale);

  return (
    <LanguageProvider locale={locale} dict={dict}>
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
    </LanguageProvider>
  );
}
