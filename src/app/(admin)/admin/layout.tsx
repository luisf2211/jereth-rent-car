import * as React from "react";
import type { Metadata } from "next";
import ResponsiveAdminLayout from "@/components/admin/ResponsiveAdminLayout";
import { BrandingProvider } from "@/components/branding/BrandingProvider";
import { getCompanySettings } from "@/lib/branding";
import { getCurrentUser } from "@/lib/auth/current-user";

export const metadata: Metadata = {
  title: {
    default: "Backoffice",
    template: "%s | Backoffice",
  },
};

/**
 * Backoffice layout. Route protection is enforced by the middleware; here we
 * load branding + the current user for the shell.
 */
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const [settings, user] = await Promise.all([getCompanySettings(), getCurrentUser()]);

  return (
    <BrandingProvider settings={settings}>
      <ResponsiveAdminLayout
        userName={user?.name ?? ""}
        userEmail={user?.email ?? ""}
        permissions={user?.permissions ?? []}
      >
        {children}
      </ResponsiveAdminLayout>
    </BrandingProvider>
  );
}
