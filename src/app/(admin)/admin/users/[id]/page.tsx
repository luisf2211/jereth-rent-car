import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PageHeader from "@/components/ui/PageHeader";
import UserForm from "@/components/admin/users/UserForm";
import { getUser, listRoleOptions } from "@/features/users/data";

export const metadata: Metadata = { title: "Editar usuario" };

export default async function EditUserPage({ params }: PageProps<"/admin/users/[id]">) {
  const { id } = await params;
  const [user, roles] = await Promise.all([getUser(id), listRoleOptions()]);

  if (!user) {
    notFound();
  }

  return (
    <>
      <PageHeader title="Editar usuario" description={user.email} />
      <UserForm roles={roles} user={user} />
    </>
  );
}
