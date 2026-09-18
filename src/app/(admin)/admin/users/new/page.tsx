import type { Metadata } from "next";
import PageHeader from "@/components/ui/PageHeader";
import AccessDenied from "@/components/admin/AccessDenied";
import UserForm from "@/components/admin/users/UserForm";
import { listRoleOptions } from "@/features/users/data";
import { getCurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/permissions";

export const metadata: Metadata = { title: "Nuevo usuario" };

export default async function NewUserPage() {
  const user = await getCurrentUser();
  if (!hasPermission(user, "users.create")) return <AccessDenied />;

  const roles = await listRoleOptions();

  return (
    <>
      <PageHeader title="Nuevo usuario" description="Crea una cuenta para un miembro del equipo." />
      <UserForm roles={roles} />
    </>
  );
}
