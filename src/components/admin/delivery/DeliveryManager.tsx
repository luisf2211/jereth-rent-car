"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import type { AdminDeliveryLocation } from "@/features/delivery-locations/data";
import {
  saveDeliveryLocation,
  deleteDeliveryLocation,
  uploadDeliveryImage,
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
    { name: "imageUrl", label: "Foto del lugar (opcional)", type: "image" },
    // UI-only selector: free vs paid delivery. Not stored directly; it drives
    // whether the amount field shows and whether deliveryFee is forced to 0.
    {
      name: "feeType",
      label: "Tipo de entrega",
      type: "radio",
      defaultValue: "free",
      options: [
        { value: "free", label: "Entrega gratis" },
        { value: "paid", label: "Cargo adicional" },
      ],
    },
    {
      name: "deliveryFee",
      label: "Monto del cargo (US$)",
      type: "number",
      defaultValue: 0,
      half: true,
      showWhen: (v) => v.feeType === "paid",
    },
    { name: "highlighted", label: "Destacado (ej. aeropuerto)", type: "switch", defaultValue: false, half: true },
    { name: "mapUrl", label: "URL del mapa (Google Maps, opcional)", type: "text" },
    { name: "sortOrder", label: "Orden", type: "number", defaultValue: 0, half: true },
    { name: "isActive", label: "Visible en el sitio", type: "switch", defaultValue: true, half: true },
  ];

  // Seed the UI-only feeType from the stored deliveryFee when editing.
  const seedValues = (
    item: AdminDeliveryLocation | null,
    values: Record<string, unknown>
  ): Record<string, unknown> => ({
    ...values,
    feeType: item && item.deliveryFee > 0 ? "paid" : "free",
  });

  // Force deliveryFee to 0 for free delivery and drop the UI-only feeType.
  const transformBeforeSave = (values: Record<string, unknown>): Record<string, unknown> => {
    const { feeType, ...rest } = values;
    return {
      ...rest,
      deliveryFee: feeType === "paid" ? rest.deliveryFee : 0,
    };
  };

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
        uploadImage={uploadDeliveryImage}
        seedValues={seedValues}
        transformBeforeSave={transformBeforeSave}
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
