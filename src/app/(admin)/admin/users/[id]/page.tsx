import type { Metadata } from "next";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";

export const metadata: Metadata = { title: "Editar usuario" };

export default async function EditUserPage({ params }: PageProps<"/admin/users/[id]">) {
  const { id } = await params;

  return (
    <>
      <PageHeader title="Editar usuario" description={`Usuario: ${id}`} />
      <Card>
        <CardContent>
          <EmptyState
            title="Edición disponible en la siguiente fase"
            description="Incluirá activar/desactivar y cambio de rol, con validación server-side."
          />
        </CardContent>
      </Card>
    </>
  );
}
