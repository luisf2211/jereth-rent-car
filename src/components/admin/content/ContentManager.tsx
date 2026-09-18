"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import type {
  AdminRequirement,
  AdminFaq,
  AdminReview,
  AdminTextItem,
} from "@/features/content/data";
import {
  saveRequirement,
  deleteRequirement,
  saveFaq,
  deleteFaq,
  saveReview,
  deleteReview,
  saveInclusion,
  deleteInclusion,
  savePolicy,
  deletePolicy,
} from "@/features/content/actions";
import ContentSection, { type FieldDef } from "./ContentSection";

interface Props {
  requirements: AdminRequirement[];
  faqs: AdminFaq[];
  reviews: AdminReview[];
  inclusions: AdminTextItem[];
  policies: AdminTextItem[];
}

/**
 * Single-screen content manager with tabs. Each tab is a list of records with
 * add/edit (modal) and delete. No separate pages — everything happens here.
 */
export default function ContentManager({
  requirements,
  faqs,
  reviews,
  inclusions,
  policies,
}: Props) {
  const router = useRouter();
  const [tab, setTab] = React.useState(0);
  const [snack, setSnack] = React.useState<{ msg: string; error?: boolean } | null>(null);

  const notify = (msg: string, error?: boolean) => {
    setSnack({ msg, error });
    if (!error) router.refresh();
  };

  const requirementFields: FieldDef[] = [
    { name: "text", label: "Requisito", type: "text", multiline: true },
    { name: "sortOrder", label: "Orden", type: "number", defaultValue: 0, half: true },
    { name: "isActive", label: "Visible en el sitio", type: "switch", defaultValue: true, half: true },
  ];

  const faqFields: FieldDef[] = [
    { name: "question", label: "Pregunta", type: "text" },
    { name: "answer", label: "Respuesta", type: "text", multiline: true },
    { name: "sortOrder", label: "Orden", type: "number", defaultValue: 0, half: true },
    { name: "isActive", label: "Visible en el sitio", type: "switch", defaultValue: true, half: true },
  ];

  const reviewFields: FieldDef[] = [
    { name: "authorName", label: "Nombre del cliente", type: "text", half: true },
    { name: "rating", label: "Rating (1-5)", type: "number", defaultValue: 5, half: true },
    { name: "comment", label: "Comentario", type: "text", multiline: true },
    { name: "avatarUrl", label: "Foto/avatar URL (opcional)", type: "text" },
    { name: "source", label: "Origen", type: "text", defaultValue: "google", half: true },
    { name: "sortOrder", label: "Orden", type: "number", defaultValue: 0, half: true },
    { name: "isActive", label: "Visible en el sitio", type: "switch", defaultValue: true },
  ];

  const textFields: FieldDef[] = [
    { name: "text", label: "Texto", type: "text", multiline: true },
    { name: "sortOrder", label: "Orden", type: "number", defaultValue: 0, half: true },
    { name: "isActive", label: "Visible en el sitio", type: "switch", defaultValue: true, half: true },
  ];

  return (
    <>
      <Card sx={{ mb: 2 }}>
        <Tabs
          value={tab}
          onChange={(_, v) => setTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ px: 1 }}
        >
          <Tab label="Requisitos" />
          <Tab label="Qué incluye" />
          <Tab label="Políticas" />
          <Tab label="FAQ" />
          <Tab label="Reseñas" />
        </Tabs>
      </Card>

      <Box hidden={tab !== 0}>
        <ContentSection<AdminRequirement>
          items={requirements}
          fields={requirementFields}
          emptyLabel="Aún no hay requisitos. Agrega el primero."
          addLabel="Nuevo requisito"
          primaryText={(r) => r.text}
          onSave={(id, values) => saveRequirement(id, values)}
          onDelete={(id) => deleteRequirement(id)}
          onResult={notify}
        />
      </Box>

      <Box hidden={tab !== 1}>
        <ContentSection<AdminTextItem>
          items={inclusions}
          fields={textFields}
          emptyLabel="Aún no hay elementos. Agrega qué incluye la renta."
          addLabel="Nuevo elemento"
          primaryText={(i) => i.text}
          onSave={(id, values) => saveInclusion(id, values)}
          onDelete={(id) => deleteInclusion(id)}
          onResult={notify}
        />
      </Box>

      <Box hidden={tab !== 2}>
        <ContentSection<AdminTextItem>
          items={policies}
          fields={textFields}
          emptyLabel="Aún no hay políticas. Agrega las reglas del vehículo."
          addLabel="Nueva política"
          primaryText={(p) => p.text}
          onSave={(id, values) => savePolicy(id, values)}
          onDelete={(id) => deletePolicy(id)}
          onResult={notify}
        />
      </Box>

      <Box hidden={tab !== 3}>
        <ContentSection<AdminFaq>
          items={faqs}
          fields={faqFields}
          emptyLabel="Aún no hay preguntas frecuentes."
          addLabel="Nueva pregunta"
          primaryText={(f) => f.question}
          secondaryText={(f) => f.answer}
          onSave={(id, values) => saveFaq(id, values)}
          onDelete={(id) => deleteFaq(id)}
          onResult={notify}
        />
      </Box>

      <Box hidden={tab !== 4}>
        <ContentSection<AdminReview>
          items={reviews}
          fields={reviewFields}
          emptyLabel="Aún no hay reseñas. Agrega reseñas reales de tus clientes."
          addLabel="Nueva reseña"
          primaryText={(r) => `${r.authorName} · ${r.rating}★`}
          secondaryText={(r) => r.comment}
          onSave={(id, values) => saveReview(id, values)}
          onDelete={(id) => deleteReview(id)}
          onResult={notify}
        />
      </Box>

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
