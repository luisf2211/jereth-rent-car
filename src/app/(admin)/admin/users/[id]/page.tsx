import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PageHeader from "@/components/ui/PageHeader";
import AccessDenied from "@/components/admin/AccessDenied";
import UserForm from "@/components/admin/users/UserForm";
import { getUser, listRoleOptions } from "@/features/users/data";
import { getCurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/permissions";

export const metadata: Metadata = { title: "Editar usuario" };

export default async function EditUserPage({ params }: PageProps<"/admin/users/[id]">) {
  const currentUser = await getCurrentUser();
  if (!hasPermission(currentUser, "users.edit")) return <AccessDenied />;

  const { id } = await params;
  const [target, roles] = await Promise.all([getUser(id), listRoleOptions()]);

  if (!target) {
    notFound();
  }

  return (
    <>
      <PageHeader title="Editar usuario" description={target.email} />
      <UserForm roles={roles} user={target} />
    </>
  );
}
