"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import {
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  type Locale,
} from "./config";
import type { Dictionary } from "./dictionaries/es";
import { createTranslator, type TFunction } from "./translate";

/**
 * Client-side i18n. The server layout resolves the locale + dictionary once
 * and passes them here, mirroring the BrandingProvider pattern. Client
 * components read the active locale and translate with `t()`.
 *
 * Changing the language:
 * - writes the NEXT_LOCALE cookie (1 year), then
 * - calls router.refresh() so server components re-render with the new
 *   dictionary WITHOUT a full navigation. This preserves client state such as
 *   an in-progress reservation form (dates, selected vehicle, typed data).
 */
type LanguageContextValue = {
  locale: Locale;
  dict: Dictionary;
  t: TFunction;
  setLocale: (next: Locale) => void;
};

const LanguageContext = React.createContext<LanguageContextValue | null>(null);

export function LanguageProvider({
  locale,
  dict,
  children,
}: {
  locale: Locale;
  dict: Dictionary;
  children: React.ReactNode;
}) {
  const router = useRouter();

  const t = React.useMemo(() => createTranslator(dict), [dict]);

  const setLocale = React.useCallback(
    (next: Locale) => {
      if (next === locale) return;
      // Persist the manual choice; it wins over Accept-Language from now on.
      document.cookie = `${LOCALE_COOKIE}=${next}; path=/; max-age=${LOCALE_COOKIE_MAX_AGE}; samesite=lax`;
      // Re-render server components with the new dictionary, keeping client
      // state (reservation form, scroll, selected vehicle) intact.
      router.refresh();
    },
    [locale, router],
  );

  const value = React.useMemo<LanguageContextValue>(
    () => ({ locale, dict, t, setLocale }),
    [locale, dict, t, setLocale],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useI18n(): LanguageContextValue {
  const ctx = React.useContext(LanguageContext);
  if (!ctx) {
    throw new Error("useI18n must be used within a LanguageProvider");
  }
  return ctx;
}
