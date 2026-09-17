import type { Metadata } from "next";
import Button from "@mui/material/Button";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import PageHeader from "@/components/ui/PageHeader";
import UsersList from "@/components/admin/users/UsersList";
import { listUsers } from "@/features/users/data";

export const metadata: Metadata = { title: "Usuarios" };

export default async function UsersPage() {
  const users = await listUsers();

  return (
    <>
      <PageHeader
        title="Usuarios"
        description="Administra las cuentas de tu equipo."
        action={
          <Button href="/admin/users/new" variant="contained" startIcon={<AddRoundedIcon />}>
            Nuevo usuario
          </Button>
        }
      />
      <UsersList users={users} />
    </>
  );
}
