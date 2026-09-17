import type { Metadata } from "next";
import Button from "@mui/material/Button";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import PeopleRoundedIcon from "@mui/icons-material/PeopleRounded";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";

export const metadata: Metadata = { title: "Usuarios" };

export default function UsersPage() {
  return (
    <>
      <PageHeader
        title="Usuarios"
        description="Administra las cuentas de tu equipo."
        action={
          <Button
            href="/admin/users/new"
            variant="contained"
            startIcon={<AddRoundedIcon />}
          >
            Nuevo usuario
          </Button>
        }
      />
      <EmptyState
        icon={<PeopleRoundedIcon />}
        title="Aún no hay usuarios"
        description="El CRUD de usuarios se conectará con la base de datos en la siguiente fase."
      />
    </>
  );
}
