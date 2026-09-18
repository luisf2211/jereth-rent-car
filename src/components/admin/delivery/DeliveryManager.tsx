"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import type { AdminDeliveryLocation } from "@/features/delivery-locations/data";
import {
  saveDeliveryLocation,
  deleteDeliveryLocation,
} from "@/features/delivery-locations/actions";
import ContentSection, { type FieldDef } from "@/components/admin/content/ContentSection";

interface Props {
  locations: AdminDeliveryLocation[];
}

/**
 * Backoffice manager for delivery / pickup locations. Each location has its
 * own delivery fee (added to the rental total when selected) and an optional
 * map URL (e.g. the airport terminal). Reuses the generic ContentSection.
 */
export default function DeliveryManager({ locations }: Props) {
  const router = useRouter();
  const [snack, setSnack] = React.useState<{ msg: string; error?: boolean } | null>(null);

  const notify = (msg: string, error?: boolean) => {
    setSnack({ msg, error });
    if (!error) router.refresh();
  };

  const fields: FieldDef[] = [
    { name: "name", label: "Nombre del lugar", type: "text" },
    { name: "description", label: "Descripción (opcional)", type: "text", multiline: true },
    { name: "deliveryFee", label: "Cargo de entrega (US$)", type: "number", defaultValue: 0, half: true },
    { name: "highlighted", label: "Destacado (ej. aeropuerto)", type: "switch", defaultValue: false, half: true },
    { name: "mapUrl", label: "URL del mapa (Google Maps, opcional)", type: "text" },
    { name: "sortOrder", label: "Orden", type: "number", defaultValue: 0, half: true },
    { name: "isActive", label: "Visible en el sitio", type: "switch", defaultValue: true, half: true },
  ];

  return (
    <>
      <ContentSection<AdminDeliveryLocation>
        items={locations}
        fields={fields}
        emptyLabel="Aún no hay lugares de entrega. Agrega el primero."
        addLabel="Nuevo lugar"
        primaryText={(d) =>
          d.deliveryFee > 0 ? `${d.name} · US$${d.deliveryFee}` : `${d.name} · Gratis`
        }
        secondaryText={(d) => d.description ?? undefined}
        onSave={(id, values) => saveDeliveryLocation(id, values)}
        onDelete={(id) => deleteDeliveryLocation(id)}
        onResult={notify}
      />

      <Snackbar
        open={Boolean(snack)}
        autoHideDuration={4000}
        onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        {snack ? (
          <Alert severity={snack.error ? "error" : "success"} variant="filled" onClose={() => setSnack(null)}>
            {snack.msg}
          </Alert>
        ) : undefined}
      </Snackbar>
    </>
  );
}
