"use client";

import * as React from "react";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import FormControlLabel from "@mui/material/FormControlLabel";
import Switch from "@mui/material/Switch";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import RadioGroup from "@mui/material/RadioGroup";
import Radio from "@mui/material/Radio";
import Alert from "@mui/material/Alert";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EmptyState from "@/components/ui/EmptyState";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import type { ActionResult } from "@/lib/actions/result";

export interface FieldDef {
  name: string;
  label: string;
  type: "text" | "number" | "switch" | "image" | "radio" | "date";
  multiline?: boolean;
  defaultValue?: string | number | boolean;
  half?: boolean;
  /** Options for "radio" fields. */
  options?: { value: string; label: string }[];
  /**
   * Optional visibility predicate. The field only renders when this returns
   * true for the current form values (e.g. show the amount only when the fee
   * type is "paid"). Hidden fields keep their value.
   */
  showWhen?: (values: Record<string, unknown>) => boolean;
}

/** Uploads a file and returns its public URL (for "image" fields). */
export type ImageUploadFn = (
  formData: FormData
) => Promise<{ ok: true; url: string } | { ok: false; message: string }>;

interface Row {
  id: string;
  isActive: boolean;
  sortOrder: number;
}

interface Props<T extends Row> {
  items: T[];
  fields: FieldDef[];
  emptyLabel: string;
  addLabel: string;
  primaryText: (item: T) => string;
  secondaryText?: (item: T) => string | undefined;
  onSave: (id: string | null, values: Record<string, unknown>) => Promise<ActionResult>;
  onDelete: (id: string) => Promise<ActionResult>;
  onResult: (message: string, error?: boolean) => void;
  /**
   * Optional extra chip shown next to the item title (e.g. review origin:
   * Google / Manual). Return null to render nothing for that item.
   */
  renderBadge?: (item: T) => { label: string; color?: "default" | "primary" | "success" | "info" } | null;
  /** Required when any field is of type "image". */
  uploadImage?: ImageUploadFn;
  /**
   * Optional last-mile normalization of the values right before saving (e.g.
   * force a fee to 0 when the "free" option is selected). Also used to seed
   * UI-only fields (like a feeType radio) from an existing item on edit.
   */
  transformBeforeSave?: (values: Record<string, unknown>) => Record<string, unknown>;
  /** Optional seeding of UI-only fields when opening the editor for an item. */
  seedValues?: (item: T | null, values: Record<string, unknown>) => Record<string, unknown>;
}

/** Inline image uploader used by "image" fields inside the editor dialog. */
function ImageField({
  label,
  value,
  onChange,
  upload,
  error,
}: {
  label: string;
  value: string;
  onChange: (url: string) => void;
  upload?: ImageUploadFn;
  error?: string;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);
  const [localError, setLocalError] = React.useState<string | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !upload) return;
    setLocalError(null);
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await upload(fd);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
    if (res.ok) onChange(res.url);
    else setLocalError(res.message);
  };

  const shown = error ?? localError;

  return (
    <Box>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        {label}
      </Typography>
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, flexWrap: "wrap" }}>
        <Box
          sx={{
            width: 120,
            height: 80,
            borderRadius: 2,
            border: "1px dashed",
            borderColor: shown ? "error.main" : "divider",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            bgcolor: "grey.50",
            overflow: "hidden",
          }}
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            <Typography variant="caption" color="text.secondary">
              Sin foto
            </Typography>
          )}
        </Box>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <input
            ref={inputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/gif"
            hidden
            onChange={handleFile}
          />
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="outlined"
              color="secondary"
              size="small"
              disabled={uploading}
              onClick={() => inputRef.current?.click()}
            >
              {uploading ? "Subiendo..." : value ? "Cambiar foto" : "Subir foto"}
            </Button>
            {value && !uploading && (
              <Button color="secondary" size="small" onClick={() => onChange("")}>
                Quitar
              </Button>
            )}
          </Box>
          <Typography variant="caption" color={shown ? "error" : "text.secondary"}>
            {shown ?? "PNG, JPG, WEBP. Máx 5MB."}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

function initialValues(fields: FieldDef[], item?: Row): Record<string, unknown> {
  const values: Record<string, unknown> = {};
  const record = item as Record<string, unknown> | undefined;
  for (const f of fields) {
    if (record && record[f.name] !== undefined && record[f.name] !== null) {
      values[f.name] = record[f.name];
    } else if (f.defaultValue !== undefined) {
      values[f.name] = f.defaultValue;
    } else {
      values[f.name] = f.type === "switch" ? false : f.type === "number" ? 0 : "";
    }
  }
  return values;
}

/**
 * Generic list + modal editor for a content type. Add/edit happen in a Dialog;
 * delete uses a confirm dialog. Client-side validation is intentionally light
 * — the server action re-validates with Zod and returns field errors.
 */
export default function ContentSection<T extends Row>({
  items,
  fields,
  emptyLabel,
  addLabel,
  primaryText,
  secondaryText,
  onSave,
  onDelete,
  onResult,
  uploadImage,
  transformBeforeSave,
  seedValues,
  renderBadge,
}: Props<T>) {
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<T | null>(null);
  const [values, setValues] = React.useState<Record<string, unknown>>({});
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [formError, setFormError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<T | null>(null);

  const openNew = () => {
    setEditing(null);
    const base = initialValues(fields);
    setValues(seedValues ? seedValues(null, base) : base);
    setFieldErrors({});
    setFormError(null);
    setOpen(true);
  };
  const openEdit = (item: T) => {
    setEditing(item);
    const base = initialValues(fields, item);
    setValues(seedValues ? seedValues(item, base) : base);
    setFieldErrors({});
    setFormError(null);
    setOpen(true);
  };

  const setField = (name: string, value: unknown) =>
    setValues((v) => ({ ...v, [name]: value }));

  const submit = async () => {
    setSaving(true);
    setFormError(null);
    setFieldErrors({});
    const payload = transformBeforeSave ? transformBeforeSave(values) : values;
    const res = await onSave(editing?.id ?? null, payload);
    setSaving(false);
    if (res.ok) {
      setOpen(false);
      onResult(res.message ?? "Guardado.");
    } else {
      setFieldErrors(res.fieldErrors ?? {});
      setFormError(res.message);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const res = await onDelete(deleteTarget.id);
    setDeleteTarget(null);
    onResult(res.message ?? "", !res.ok);
  };

  return (
    <>
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
        <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={openNew}>
          {addLabel}
        </Button>
      </Box>

      {items.length === 0 ? (
        <EmptyState title={emptyLabel} />
      ) : (
        <Stack spacing={1.5}>
          {items.map((item) => (
            <Card key={item.id}>
              <CardContent sx={{ py: 2, "&:last-child": { pb: 2 } }}>
                <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                        {primaryText(item)}
                      </Typography>
                      {(() => {
                        const badge = renderBadge?.(item);
                        return badge ? (
                          <Chip label={badge.label} size="small" color={badge.color ?? "default"} />
                        ) : null;
                      })()}
                      {!item.isActive && <Chip label="Oculto" size="small" variant="outlined" />}
                    </Box>
                    {secondaryText?.(item) && (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                        {secondaryText(item)}
                      </Typography>
                    )}
                  </Box>
                  <IconButton aria-label="Editar" onClick={() => openEdit(item)}>
                    <EditRoundedIcon fontSize="small" />
                  </IconButton>
                  <IconButton aria-label="Eliminar" onClick={() => setDeleteTarget(item)}>
                    <DeleteOutlineRoundedIcon fontSize="small" />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editing ? "Editar" : "Agregar"}</DialogTitle>
        <DialogContent>
          {formError && (
            <Alert severity="error" sx={{ mb: 2, mt: 1 }}>
              {formError}
            </Alert>
          )}
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            {fields
              .filter((f) => !f.showWhen || f.showWhen(values))
              .map((f) => (
              <Grid key={f.name} size={{ xs: 12, sm: f.half ? 6 : 12 }}>
                {f.type === "radio" ? (
                  <FormControl error={Boolean(fieldErrors[f.name])}>
                    <FormLabel sx={{ fontSize: "0.9rem", mb: 0.5 }}>{f.label}</FormLabel>
                    <RadioGroup
                      row
                      value={String(values[f.name] ?? "")}
                      onChange={(e) => setField(f.name, e.target.value)}
                    >
                      {(f.options ?? []).map((opt) => (
                        <FormControlLabel
                          key={opt.value}
                          value={opt.value}
                          control={<Radio />}
                          label={opt.label}
                        />
                      ))}
                    </RadioGroup>
                  </FormControl>
                ) : f.type === "switch" ? (
                  <FormControlLabel
                    control={
                      <Switch
                        checked={Boolean(values[f.name])}
                        onChange={(e) => setField(f.name, e.target.checked)}
                      />
                    }
                    label={f.label}
                  />
                ) : f.type === "image" ? (
                  <ImageField
                    label={f.label}
                    value={String(values[f.name] ?? "")}
                    onChange={(url) => setField(f.name, url)}
                    upload={uploadImage}
                    error={fieldErrors[f.name]}
                  />
                ) : f.type === "date" ? (
                  <TextField
                    fullWidth
                    type="date"
                    label={f.label}
                    value={values[f.name] ?? ""}
                    onChange={(e) => setField(f.name, e.target.value)}
                    error={Boolean(fieldErrors[f.name])}
                    helperText={fieldErrors[f.name]}
                    slotProps={{ inputLabel: { shrink: true } }}
                  />
                ) : (
                  <TextField
                    fullWidth
                    type={f.type === "number" ? "number" : "text"}
                    label={f.label}
                    multiline={f.multiline}
                    minRows={f.multiline ? 3 : undefined}
                    value={values[f.name] ?? ""}
                    onChange={(e) =>
                      setField(f.name, f.type === "number" ? e.target.value : e.target.value)
                    }
                    error={Boolean(fieldErrors[f.name])}
                    helperText={fieldErrors[f.name]}
                  />
                )}
              </Grid>
            ))}
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button color="secondary" onClick={() => setOpen(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button variant="contained" onClick={submit} disabled={saving}>
            {saving ? "Guardando..." : "Guardar"}
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        title="Eliminar"
        description="Esta acción no se puede deshacer. ¿Continuar?"
        confirmLabel="Eliminar"
        confirmColor="error"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </>
  );
}
