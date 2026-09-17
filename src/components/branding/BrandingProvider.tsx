"use client";

import * as React from "react";
import type { CompanySettings } from "@/types/branding";

/**
 * Makes company branding available to client components (header, sidebar,
 * logo, etc.) without prop-drilling. Server layouts fetch the settings once
 * with getCompanySettings() and provide them here.
 */
const BrandingContext = React.createContext<CompanySettings | null>(null);

export function BrandingProvider({
  settings,
  children,
}: {
  settings: CompanySettings;
  children: React.ReactNode;
}) {
  return <BrandingContext.Provider value={settings}>{children}</BrandingContext.Provider>;
}

export function useBranding(): CompanySettings {
  const ctx = React.useContext(BrandingContext);
  if (!ctx) {
    throw new Error("useBranding must be used within a BrandingProvider");
  }
  return ctx;
}
