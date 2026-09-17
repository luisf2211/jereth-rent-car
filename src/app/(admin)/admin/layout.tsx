import * as React from "react";
import type { Metadata } from "next";
import ResponsiveAdminLayout from "@/components/admin/ResponsiveAdminLayout";

export const metadata: Metadata = {
  title: {
    default: "Backoffice",
    template: "%s | Backoffice",
  },
};

/**
 * Backoffice layout. In Phase 2 this is where the auth guard for /admin/*
 * (redirect unauthenticated users) will live, before rendering the shell.
 */
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return <ResponsiveAdminLayout>{children}</ResponsiveAdminLayout>;
}
