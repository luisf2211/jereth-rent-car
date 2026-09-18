import * as React from "react";
import PageHeader from "@/components/ui/PageHeader";
import EmptyState from "@/components/ui/EmptyState";
import BlockRoundedIcon from "@mui/icons-material/BlockRounded";

/**
 * Shown when the current user's role lacks access to a module. Used by admin
 * pages after a server-side permission check.
 */
export default function AccessDenied() {
  return (
    <>
      <PageHeader title="Acceso restringido" />
      <EmptyState
        icon={<BlockRoundedIcon />}
        title="No tienes acceso a este módulo"
        description="Tu rol no incluye el permiso necesario. Contacta a un administrador si crees que es un error."
      />
    </>
  );
}
