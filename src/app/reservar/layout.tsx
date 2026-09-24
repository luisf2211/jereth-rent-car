import * as React from "react";

import { LanguageProvider } from "@/i18n/LanguageProvider";
import { getServerLocale, getDictionary } from "@/i18n/server";

/**
 * The reservation flow (/reservar/nuevo and /reservar/[token]) lives outside
 * the (public) route group, so it needs its own LanguageProvider for the
 * client reservation form + tracking portal to translate. Locale is resolved
 * from the same NEXT_LOCALE cookie, so the language chosen on the site carries
 * over here without losing form state.
 */
export default async function ReservarLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getServerLocale();
  const dict = await getDictionary(locale);

  return (
    <LanguageProvider locale={locale} dict={dict}>
      {children}
    </LanguageProvider>
  );
}
