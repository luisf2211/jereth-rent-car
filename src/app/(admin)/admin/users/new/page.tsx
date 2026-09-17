import type { Metadata } from "next";
import PageHeader from "@/components/ui/PageHeader";
import UserForm from "@/components/admin/users/UserForm";
import { listRoleOptions } from "@/features/users/data";

export const metadata: Metadata = { title: "Nuevo usuario" };

export default async function NewUserPage() {
  const roles = await listRoleOptions();

  return (
    <>
      <PageHeader title="Nuevo usuario" description="Crea una cuenta para un miembro del equipo." />
      <UserForm roles={roles} />
    </>
  );
}
