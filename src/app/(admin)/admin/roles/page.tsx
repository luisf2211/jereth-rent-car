import type { Metadata } from "next";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import RolesManager from "@/components/admin/roles/RolesManager";
import { listRoles } from "@/features/roles/data";
import { getCurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/permissions";

export const metadata: Metadata = { title: "Roles" };

export default async function RolesPage() {
  const user = await getCurrentUser();

  if (!hasPermission(user, "roles.view")) {
    return (
      <>
        <PageHeader title="Roles y permisos" />
        <EmptyState
          title="Sin acceso"
          description="No tienes permiso para ver este módulo."
        />
      </>
    );
  }

  const roles = await listRoles();
  const canManage = hasPermission(user, "roles.manage");

  return (
    <>
      <PageHeader
        title="Roles y permisos"
        description="Define roles y controla a qué módulos y acciones accede cada usuario."
      />
      <RolesManager roles={roles} canManage={canManage} />
    </>
  );
}
