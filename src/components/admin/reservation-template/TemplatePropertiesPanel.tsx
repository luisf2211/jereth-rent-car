"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import UploadRoundedIcon from "@mui/icons-material/UploadRounded";
import type { TemplateElement, TemplateRow, ElementStyle } from "@/features/reservation-template/types";
import { ELEMENT_LABELS } from "@/features/reservation-template/types";
import { uploadVehicleImage } from "@/features/vehicles/actions";

/**
 * Small upload control for image elements (footer banner, header, decorative
 * images). Reuses the existing storage action (Supabase, vehicles/ folder) and
 * sets the uploaded URL as the element's `src`. Accepts PNG/JPG/WebP.
 */
function ImageUploadButton({ onUploaded }: { onUploaded: (url: string) => void }) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await uploadVehicleImage(fd);
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
    if (res.ok) onUploaded(res.url);
    else setError(res.message);
  };

  return (
    <Box>
      <input ref={inputRef} type="file" accept="image/png,image/jpeg,image/webp,image/gif" hidden onChange={handleFile} />
      <Button
        size="small"
        variant="outlined"
        color="secondary"
        fullWidth
        startIcon={uploading ? <CircularProgress size={14} /> : <UploadRoundedIcon />}
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
      >
        {uploading ? "Subiendo..." : "Subir imagen"}
      </Button>
      <Typography variant="caption" color={error ? "error" : "text.secondary"} sx={{ display: "block", mt: 0.5 }}>
        {error ?? "PNG, JPG o WebP. Máx 5MB."}
      </Typography>
    </Box>
  );
}

/**
 * Properties panel for the selected element (and its row). Edits margins,
 * padding, alignment, size, background, color, typography, borders/radius,
 * image fit/size, and row height/background/gap. All changes are immutable
 * patches bubbled up to the editor.
 */

interface Props {
  element: TemplateElement | null;
  row: TemplateRow | null;
  onChangeElement: (patch: Partial<TemplateElement>) => void;
  onChangeRow: (patch: Partial<TemplateRow>) => void;
}

function num(v: string): number | undefined {
  if (v === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

function NumField({ label, value, onChange }: { label: string; value?: number; onChange: (v: number | undefined) => void }) {
  return (
    <TextField
      label={label}
      size="small"
      type="number"
      value={value ?? ""}
      onChange={(e) => onChange(num(e.target.value))}
      fullWidth
    />
  );
}

export default function TemplatePropertiesPanel({ element, row, onChangeElement, onChangeRow }: Props) {
  if (!element) {
    return (
      <>
        {row ? (
          <Stack spacing={1.5}>
            <Typography variant="caption" color="text.secondary">Fila seleccionada · propiedades de la fila</Typography>
            <NumField label="Alto mínimo (px)" value={row.height} onChange={(v) => onChangeRow({ height: v })} />
            <NumField label="Espacio entre columnas (px)" value={row.gap} onChange={(v) => onChangeRow({ gap: v })} />
            <Box sx={{ display: "flex", gap: 1 }}>
              <NumField label="Padding X" value={row.paddingX} onChange={(v) => onChangeRow({ paddingX: v })} />
              <NumField label="Padding Y" value={row.paddingY} onChange={(v) => onChangeRow({ paddingY: v })} />
            </Box>
            <TextField label="Fondo de fila" size="small" value={row.background ?? ""} onChange={(e) => onChangeRow({ background: e.target.value || undefined })} placeholder="#FFFFFF o transparent" fullWidth />
          </Stack>
        ) : (
          <Typography variant="caption" color="text.secondary">
            Selecciona un elemento para editar sus propiedades, o una columna para agregar elementos.
          </Typography>
        )}
      </>
    );
  }

  const st = element.style;
  const patchStyle = (p: Partial<ElementStyle>) => onChangeElement({ style: { ...st, ...p } } as Partial<TemplateElement>);

  const isText = element.type === "title" || element.type === "text";
  const isImageLike = element.type === "image" || element.type === "logo" || element.type === "vehicleImage";

  return (
    <Stack spacing={1.5}>
      <Typography variant="caption" color="text.secondary">{ELEMENT_LABELS[element.type]}</Typography>

      {isText && (
        <TextField
          label="Contenido"
          size="small"
          value={(element as { content: string }).content}
          onChange={(e) => onChangeElement({ content: e.target.value } as Partial<TemplateElement>)}
          multiline
          minRows={2}
          fullWidth
          helperText="Puedes insertar tokens con el botón de arriba."
        />
      )}

      {"heading" in element && (
        <TextField
          label="Encabezado"
          size="small"
          value={element.heading ?? ""}
          onChange={(e) => onChangeElement({ heading: e.target.value } as Partial<TemplateElement>)}
          fullWidth
        />
      )}

      {element.type === "image" && (
        <>
          <TextField
            label="URL de imagen o token"
            size="small"
            value={element.src}
            onChange={(e) => onChangeElement({ src: e.target.value } as Partial<TemplateElement>)}
            fullWidth
            placeholder="https://... o {{vehicle.image}}"
          />
          <ImageUploadButton onUploaded={(url) => onChangeElement({ src: url } as Partial<TemplateElement>)} />
        </>
      )}

      {element.type === "statusCard" && (
        <>
          <TextField
            label="Etiqueta (arriba)"
            size="small"
            value={element.label}
            onChange={(e) => onChangeElement({ label: e.target.value } as Partial<TemplateElement>)}
            fullWidth
            helperText="Texto pequeño en mayúsculas. Admite {{tokens}}."
          />
          <TextField
            label="Valor"
            size="small"
            value={element.value ?? ""}
            onChange={(e) => onChangeElement({ value: e.target.value } as Partial<TemplateElement>)}
            fullWidth
            placeholder="{{reservation.code}}"
            helperText="Deja vacío para la tarjeta sólida (solo etiqueta)."
          />
          <TextField
            select
            label="Estilo de tarjeta"
            size="small"
            value={element.variant}
            onChange={(e) => onChangeElement({ variant: e.target.value as "light" | "solid" } as Partial<TemplateElement>)}
            fullWidth
          >
            <MenuItem value="light">Clara (borde fucsia)</MenuItem>
            <MenuItem value="solid">Fucsia sólida (texto blanco)</MenuItem>
          </TextField>
        </>
      )}

      {(element.type === "spacer" || element.type === "separator") && (
        <NumField label={element.type === "spacer" ? "Alto (px)" : "Grosor (px)"} value={(element as { size?: number }).size} onChange={(v) => onChangeElement({ size: v } as Partial<TemplateElement>)} />
      )}

      {isImageLike && (
        <>
          <TextField select label="Ajuste de imagen" size="small" value={(element as { fit: string }).fit} onChange={(e) => onChangeElement({ fit: e.target.value } as Partial<TemplateElement>)} fullWidth helperText="Contain = completo y proporcional; Cover = recorta para llenar.">
            <MenuItem value="contain">Contain (completo)</MenuItem>
            <MenuItem value="cover">Cover (llena/recorta)</MenuItem>
          </TextField>
          <Box sx={{ display: "flex", gap: 1 }}>
            <NumField label="Ancho (px)" value={(element as { width?: number }).width} onChange={(v) => onChangeElement({ width: v } as Partial<TemplateElement>)} />
            <NumField label="Alto (px)" value={(element as { height?: number }).height} onChange={(v) => onChangeElement({ height: v } as Partial<TemplateElement>)} />
          </Box>
        </>
      )}

      <Divider textAlign="left"><Typography variant="caption">Estilo</Typography></Divider>

      <TextField select label="Alineación" size="small" value={st.align ?? "left"} onChange={(e) => patchStyle({ align: e.target.value as ElementStyle["align"] })} fullWidth>
        <MenuItem value="left">Izquierda</MenuItem>
        <MenuItem value="center">Centro</MenuItem>
        <MenuItem value="right">Derecha</MenuItem>
      </TextField>

      {(isText || "heading" in element) && (
        <>
          <Box sx={{ display: "flex", gap: 1 }}>
            <NumField label="Tamaño fuente" value={st.fontSize} onChange={(v) => patchStyle({ fontSize: v })} />
            <TextField select label="Peso" size="small" value={st.fontWeight ?? "normal"} onChange={(e) => patchStyle({ fontWeight: e.target.value as ElementStyle["fontWeight"] })} fullWidth>
              <MenuItem value="normal">Normal</MenuItem>
              <MenuItem value="bold">Negrita</MenuItem>
            </TextField>
          </Box>
          <Box sx={{ display: "flex", gap: 1 }}>
            <NumField label="Interlineado" value={st.lineHeight} onChange={(v) => patchStyle({ lineHeight: v })} />
            <TextField select label="Estilo" size="small" value={st.fontStyle ?? "normal"} onChange={(e) => patchStyle({ fontStyle: e.target.value as ElementStyle["fontStyle"] })} fullWidth>
              <MenuItem value="normal">Normal</MenuItem>
              <MenuItem value="italic">Itálica</MenuItem>
            </TextField>
          </Box>
        </>
      )}

      <TextField label="Color de texto" size="small" value={st.color ?? ""} onChange={(e) => patchStyle({ color: e.target.value || undefined })} placeholder="#191919" fullWidth />
      <TextField label="Fondo del contenedor" size="small" value={st.background ?? ""} onChange={(e) => patchStyle({ background: e.target.value || undefined })} placeholder="transparent / #FFFFFF" fullWidth />

      <Box sx={{ display: "flex", gap: 1 }}>
        <NumField label="Margen arriba" value={st.marginTop} onChange={(v) => patchStyle({ marginTop: v })} />
        <NumField label="Margen abajo" value={st.marginBottom} onChange={(v) => patchStyle({ marginBottom: v })} />
      </Box>
      <Box sx={{ display: "flex", gap: 1 }}>
        <NumField label="Padding X" value={st.paddingX} onChange={(v) => patchStyle({ paddingX: v })} />
        <NumField label="Padding Y" value={st.paddingY} onChange={(v) => patchStyle({ paddingY: v })} />
      </Box>
      <Box sx={{ display: "flex", gap: 1 }}>
        <NumField label="Borde (px)" value={st.borderWidth} onChange={(v) => patchStyle({ borderWidth: v })} />
        <NumField label="Radio (px)" value={st.borderRadius} onChange={(v) => patchStyle({ borderRadius: v })} />
      </Box>
      <TextField label="Color de borde" size="small" value={st.borderColor ?? ""} onChange={(e) => patchStyle({ borderColor: e.target.value || undefined })} placeholder="#E4E4E7" fullWidth />
    </Stack>
  );
}
