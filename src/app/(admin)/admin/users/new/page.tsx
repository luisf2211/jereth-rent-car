import type { Metadata } from "next";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";

export const metadata: Metadata = { title: "Nuevo usuario" };

export default function NewUserPage() {
  return (
    <>
      <PageHeader title="Nuevo usuario" description="Crea una cuenta para un miembro del equipo." />
      <Card>
        <CardContent>
          <EmptyState
            title="Formulario disponible en la siguiente fase"
            description="Se implementará con React Hook Form + Zod y validación server-side."
          />
        </CardContent>
      </Card>
    </>
  );
}
