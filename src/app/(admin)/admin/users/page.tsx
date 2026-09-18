import type { Metadata } from "next";
import Button from "@mui/material/Button";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import PageHeader from "@/components/ui/PageHeader";
import AccessDenied from "@/components/admin/AccessDenied";
import UsersList from "@/components/admin/users/UsersList";
import { listUsers } from "@/features/users/data";
import { getCurrentUser } from "@/lib/auth/current-user";
import { hasPermission } from "@/lib/permissions";

export const metadata: Metadata = { title: "Usuarios" };

export default async function UsersPage() {
  const user = await getCurrentUser();
  if (!hasPermission(user, "users.view")) return <AccessDenied />;

  const canCreate = hasPermission(user, "users.create");
  const canManage = hasPermission(user, "users.edit") || hasPermission(user, "users.disable");
  const users = await listUsers();

  return (
    <>
      <PageHeader
        title="Usuarios"
        description="Administra las cuentas de tu equipo."
        action={
          canCreate ? (
            <Button href="/admin/users/new" variant="contained" startIcon={<AddRoundedIcon />}>
              Nuevo usuario
            </Button>
          ) : undefined
        }
      />
      <UsersList users={users} canManage={canManage} />
    </>
  );
}
