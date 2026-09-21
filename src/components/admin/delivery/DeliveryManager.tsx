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
      label: "Monto del cargo (US$) — deja 0 para mostrar solo la etiqueta",
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

  // Seed the UI-only feeType from the stored hasFee flag when editing.
  const seedValues = (
    item: AdminDeliveryLocation | null,
    values: Record<string, unknown>
  ): Record<string, unknown> => ({
    ...values,
    feeType: item?.hasFee ? "paid" : "free",
  });

  // Map the UI-only feeType to hasFee. When "paid" with amount 0, the location
  // shows "Cargo adicional" without an amount and adds nothing to the total.
  const transformBeforeSave = (values: Record<string, unknown>): Record<string, unknown> => {
    const { feeType, ...rest } = values;
    const hasFee = feeType === "paid";
    return {
      ...rest,
      hasFee,
      deliveryFee: hasFee ? rest.deliveryFee : 0,
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
          !d.hasFee
            ? `${d.name} · Gratis`
            : d.deliveryFee > 0
              ? `${d.name} · Cargo US$${d.deliveryFee}`
              : `${d.name} · Cargo adicional`
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
