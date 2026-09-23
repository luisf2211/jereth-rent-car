"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import ToggleButton from "@mui/material/ToggleButton";
import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import TextField from "@mui/material/TextField";
import ListSubheader from "@mui/material/ListSubheader";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import ArrowUpwardRoundedIcon from "@mui/icons-material/ArrowUpwardRounded";
import ArrowDownwardRoundedIcon from "@mui/icons-material/ArrowDownwardRounded";
import DragIndicatorRoundedIcon from "@mui/icons-material/DragIndicatorRounded";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import TemplateElementView from "./TemplateElementView";
import TemplatePropertiesPanel from "./TemplatePropertiesPanel";
import {
  A4_WIDTH_PX,
  A4_HEIGHT_PX,
  ELEMENT_LABELS,
  PALETTE_ORDER,
  makeElement,
  type TemplateDocument,
  type TemplateElement,
  type TemplateElementType,
  type TemplateRow,
} from "@/features/reservation-template/types";
import { TOKEN_CATALOG } from "@/features/reservation-template/tokens";
import { sampleSnapshot } from "@/features/reservation-template/tokens";
import { saveReservationTemplateDraft, publishReservationTemplate } from "@/features/reservation-template/actions";

let idCounter = 0;
const newId = (p: string) => `${p}_${Date.now().toString(36)}_${(idCounter++).toString(36)}`;

interface PreviewVehicleOption {
  id: string;
  title: string;
  imageUrl: string; // already documentImageUrl || imageUrl
  specs: string[];
  dailyPrice: number;
}

interface Props {
  initialDocument: TemplateDocument;
  initialName: string;
  publishedExists: boolean;
  /** Real official logo URL (CompanySettings.logoUrl) for the preview. */
  logoUrl?: string;
  /** Vehicles to preview the template with real data. */
  previewVehicles?: PreviewVehicleOption[];
}

type Selection = { rowId: string; col: number; elId: string } | null;

const SCALE = 0.86; // fit the A4 surface comfortably in the canvas column

export default function ReservationTemplateEditor({ initialDocument, initialName, logoUrl, previewVehicles = [] }: Props) {
  const [doc, setDoc] = React.useState<TemplateDocument>(initialDocument);
  const [name] = React.useState(initialName);
  const [mode, setMode] = React.useState<"edit" | "preview">("edit");
  const [selected, setSelected] = React.useState<Selection>(null);
  const [snack, setSnack] = React.useState<{ msg: string; error?: boolean } | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [confirmPublish, setConfirmPublish] = React.useState(false);
  const [tokenMenu, setTokenMenu] = React.useState<null | HTMLElement>(null);
  // Preview: which real vehicle to render the "Foto del vehículo" with. Empty
  // = the built-in sample. Selecting one uses its documentImageUrl||imageUrl.
  const [previewVehicleId, setPreviewVehicleId] = React.useState<string>("");

  const snapshot = React.useMemo(() => {
    const s = sampleSnapshot();
    // Connect the "Logo oficial" element to the real project logo so the
    // preview shows it (not the placeholder). Uses the same source the site
    // uses (CompanySettings.logoUrl).
    if (logoUrl) {
      s.company = { ...s.company, logoUrl, footerLogoUrl: s.company.footerLogoUrl || logoUrl };
    }
    // If the admin picked a real vehicle for the preview, use its data. The
    // image is already documentImageUrl||imageUrl (resolved server-side).
    const veh = previewVehicles.find((v) => v.id === previewVehicleId);
    if (veh) {
      s.vehicleTitle = veh.title;
      s.vehicleImageUrl = veh.imageUrl;
      s.vehicleSpecs = veh.specs;
      s.dailyPrice = veh.dailyPrice;
    }
    return s;
  }, [logoUrl, previewVehicleId, previewVehicles]);

  // ---- Row / element mutations (immutable) ----
  const addRow = (columns: 1 | 2 | 3) => {
    const row: TemplateRow = {
      id: newId("row"),
      columns,
      cells: Array.from({ length: columns }, () => []),
      gap: 12,
      paddingX: 0,
      paddingY: 0,
    };
    setDoc((d) => ({ ...d, rows: [...d.rows, row] }));
  };

  const removeRow = (rowId: string) => {
    setDoc((d) => ({ ...d, rows: d.rows.filter((r) => r.id !== rowId) }));
    setSelected((s) => (s?.rowId === rowId ? null : s));
  };

  const moveRow = (rowId: string, dir: -1 | 1) => {
    setDoc((d) => {
      const i = d.rows.findIndex((r) => r.id === rowId);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= d.rows.length) return d;
      const rows = [...d.rows];
      [rows[i], rows[j]] = [rows[j], rows[i]];
      return { ...d, rows };
    });
  };

  const addElement = (rowId: string, col: number, type: TemplateElementType) => {
    const el = makeElement(type, newId("el"));
    setDoc((d) => ({
      ...d,
      rows: d.rows.map((r) =>
        r.id === rowId ? { ...r, cells: r.cells.map((c, ci) => (ci === col ? [...c, el] : c)) } : r
      ),
    }));
    setSelected({ rowId, col, elId: el.id });
  };

  const updateElement = (rowId: string, col: number, elId: string, patch: Partial<TemplateElement>) => {
    setDoc((d) => ({
      ...d,
      rows: d.rows.map((r) =>
        r.id === rowId
          ? { ...r, cells: r.cells.map((c, ci) => (ci === col ? c.map((e) => (e.id === elId ? ({ ...e, ...patch } as TemplateElement) : e)) : c)) }
          : r
      ),
    }));
  };

  const removeElement = (rowId: string, col: number, elId: string) => {
    setDoc((d) => ({
      ...d,
      rows: d.rows.map((r) =>
        r.id === rowId ? { ...r, cells: r.cells.map((c, ci) => (ci === col ? c.filter((e) => e.id !== elId) : c)) } : r
      ),
    }));
    setSelected(null);
  };

  const duplicateElement = (rowId: string, col: number, elId: string) => {
    setDoc((d) => ({
      ...d,
      rows: d.rows.map((r) => {
        if (r.id !== rowId) return r;
        return {
          ...r,
          cells: r.cells.map((c, ci) => {
            if (ci !== col) return c;
            const idx = c.findIndex((e) => e.id === elId);
            if (idx < 0) return c;
            const copy = { ...c[idx], id: newId("el") } as TemplateElement;
            const next = [...c];
            next.splice(idx + 1, 0, copy);
            return next;
          }),
        };
      }),
    }));
  };

  const moveElement = (rowId: string, col: number, elId: string, dir: -1 | 1) => {
    setDoc((d) => ({
      ...d,
      rows: d.rows.map((r) => {
        if (r.id !== rowId) return r;
        return {
          ...r,
          cells: r.cells.map((c, ci) => {
            if (ci !== col) return c;
            const i = c.findIndex((e) => e.id === elId);
            const j = i + dir;
            if (i < 0 || j < 0 || j >= c.length) return c;
            const next = [...c];
            [next[i], next[j]] = [next[j], next[i]];
            return next;
          }),
        };
      }),
    }));
  };

  const updateRow = (rowId: string, patch: Partial<TemplateRow>) => {
    setDoc((d) => ({ ...d, rows: d.rows.map((r) => (r.id === rowId ? { ...r, ...patch } : r)) }));
  };

  // Drag & drop reordering within a column (dnd-kit). Item ids are the element
  // ids; the sortable context is scoped per column.
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));
  const onDragEnd = (rowId: string, col: number) => (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    setDoc((d) => ({
      ...d,
      rows: d.rows.map((r) => {
        if (r.id !== rowId) return r;
        return {
          ...r,
          cells: r.cells.map((c, ci) => {
            if (ci !== col) return c;
            const from = c.findIndex((el) => el.id === active.id);
            const to = c.findIndex((el) => el.id === over.id);
            if (from < 0 || to < 0) return c;
            return arrayMove(c, from, to);
          }),
        };
      }),
    }));
  };

  // ---- Save / publish ----
  const save = async (publish: boolean) => {
    setSaving(true);
    const payload = { name, document: doc };
    const res = publish ? await publishReservationTemplate(payload) : await saveReservationTemplateDraft(payload);
    setSaving(false);
    setConfirmPublish(false);
    setSnack({ msg: res.message ?? "", error: !res.ok });
  };

  const selectedElement: TemplateElement | null = React.useMemo(() => {
    if (!selected) return null;
    const row = doc.rows.find((r) => r.id === selected.rowId);
    return row?.cells[selected.col]?.find((e) => e.id === selected.elId) ?? null;
  }, [selected, doc]);

  const selectedRow = selected ? doc.rows.find((r) => r.id === selected.rowId) ?? null : null;

  // Insert a token into the selected textual/image element's content/src.
  const insertToken = (token: string) => {
    setTokenMenu(null);
    if (!selected || !selectedElement) return;
    const { rowId, col, elId } = selected;
    if (selectedElement.type === "title" || selectedElement.type === "text") {
      updateElement(rowId, col, elId, { content: `${selectedElement.content} ${token}`.trim() } as Partial<TemplateElement>);
    } else if (selectedElement.type === "image") {
      updateElement(rowId, col, elId, { src: token } as Partial<TemplateElement>);
    } else if ("heading" in selectedElement) {
      updateElement(rowId, col, elId, { heading: `${selectedElement.heading ?? ""} ${token}`.trim() } as Partial<TemplateElement>);
    }
  };

  const tokenGroups = React.useMemo(() => {
    const g: Record<string, typeof TOKEN_CATALOG> = {};
    for (const tk of TOKEN_CATALOG) (g[tk.group] ??= []).push(tk);
    return g;
  }, []);

  return (
    <>
      {/* Toolbar */}
      <Paper variant="outlined" sx={{ p: 1.5, mb: 2, display: "flex", alignItems: "center", gap: 1.5, flexWrap: "wrap", position: "sticky", top: 64, zIndex: 2 }}>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={mode}
          onChange={(_, v) => v && setMode(v)}
        >
          <ToggleButton value="edit">Editar</ToggleButton>
          <ToggleButton value="preview">Vista previa</ToggleButton>
        </ToggleButtonGroup>

        {mode === "preview" && previewVehicles.length > 0 && (
          <TextField
            select
            size="small"
            label="Vehículo de prueba"
            value={previewVehicleId}
            onChange={(e) => setPreviewVehicleId(e.target.value)}
            sx={{ minWidth: 240 }}
          >
            <MenuItem value="">Datos de muestra</MenuItem>
            {previewVehicles.map((v) => (
              <MenuItem key={v.id} value={v.id}>{v.title}</MenuItem>
            ))}
          </TextField>
        )}

        <Box sx={{ flexGrow: 1 }} />

        <Button size="small" variant="outlined" disabled={saving} onClick={() => save(false)}>
          {saving ? "Guardando..." : "Guardar borrador"}
        </Button>
        <Button size="small" variant="contained" disabled={saving} onClick={() => setConfirmPublish(true)}>
          Publicar plantilla
        </Button>
      </Paper>

      <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start" }}>
        {/* Palette (edit mode only) */}
        {mode === "edit" && (
          <Paper variant="outlined" sx={{ p: 1.5, width: 210, flexShrink: 0, position: "sticky", top: 132 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Filas</Typography>
            <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
              {[1, 2, 3].map((n) => (
                <Button key={n} size="small" variant="outlined" onClick={() => addRow(n as 1 | 2 | 3)} startIcon={<AddRoundedIcon />} sx={{ minWidth: 0, px: 1 }}>
                  {n}
                </Button>
              ))}
            </Stack>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>Elementos</Typography>
            {!selected && (
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                Selecciona una columna (haz clic en una fila) para agregar elementos.
              </Typography>
            )}
            <Stack spacing={0.5}>
              {PALETTE_ORDER.map((type) => (
                <Button
                  key={type}
                  size="small"
                  variant="text"
                  disabled={!selected}
                  onClick={() => selected && addElement(selected.rowId, selected.col, type)}
                  sx={{ justifyContent: "flex-start", textTransform: "none", color: "text.primary" }}
                >
                  {ELEMENT_LABELS[type]}
                </Button>
              ))}
            </Stack>
          </Paper>
        )}

        {/* Canvas / preview */}
        <Box sx={{ flexGrow: 1, display: "flex", justifyContent: "center", overflow: "auto", bgcolor: "grey.100", p: 2, borderRadius: 2 }}>
          <Box
            sx={{
              width: A4_WIDTH_PX * SCALE,
              // Hug the content: don't force the full A4 height (that left a big
              // empty band under the footer). The dashed guide still marks the
              // A4 limit so you can confirm it fits.
              transformOrigin: "top center",
            }}
          >
            <Paper
              elevation={3}
              sx={{
                width: A4_WIDTH_PX,
                // Auto height: the sheet ends right after the last row (footer),
                // so there is no reserved empty space below it.
                transform: `scale(${SCALE})`,
                transformOrigin: "top left",
                position: "relative",
                background: doc.page.background,
                px: `${doc.page.paddingX}px`,
                py: `${doc.page.paddingY}px`,
                boxSizing: "border-box",
              }}
            >
              {/* Page-fit guide: a dashed line at the A4 bottom limit */}
              <Box
                sx={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: A4_HEIGHT_PX,
                  borderTop: "2px dashed",
                  borderColor: "error.main",
                  "&::after": {
                    content: '"Límite de página A4"',
                    position: "absolute",
                    right: 4,
                    top: 2,
                    fontSize: 10,
                    color: "#d32f2f",
                  },
                }}
              />
              {doc.rows.length === 0 && (
                <Box sx={{ textAlign: "center", color: "text.secondary", py: 8, border: "2px dashed #ddd", borderRadius: 2 }}>
                  Agrega una fila para empezar (1, 2 o 3 columnas).
                </Box>
              )}
              <Stack spacing={0}>
                {doc.rows.map((row) => (
                  <Box
                    key={row.id}
                    sx={{
                      position: "relative",
                      background: row.background ?? "transparent",
                      px: `${row.paddingX ?? 0}px`,
                      py: `${row.paddingY ?? 0}px`,
                      minHeight: row.height ? `${row.height}px` : undefined,
                      outline: mode === "edit" ? "1px dashed rgba(0,0,0,0.12)" : "none",
                      "&:hover .rowTools": { opacity: mode === "edit" ? 1 : 0 },
                    }}
                  >
                    {mode === "edit" && (
                      <Box className="rowTools" sx={{ position: "absolute", top: 2, right: 2, opacity: 0, transition: "0.15s", display: "flex", gap: 0.25, bgcolor: "background.paper", borderRadius: 1, boxShadow: 1, zIndex: 3 }}>
                        <IconButton size="small" onClick={() => moveRow(row.id, -1)} aria-label="Subir fila"><ArrowUpwardRoundedIcon fontSize="small" /></IconButton>
                        <IconButton size="small" onClick={() => moveRow(row.id, 1)} aria-label="Bajar fila"><ArrowDownwardRoundedIcon fontSize="small" /></IconButton>
                        <IconButton size="small" color="error" onClick={() => removeRow(row.id)} aria-label="Eliminar fila"><DeleteOutlineRoundedIcon fontSize="small" /></IconButton>
                      </Box>
                    )}
                    <Box sx={{ display: "grid", gridTemplateColumns: `repeat(${row.columns}, 1fr)`, gap: `${row.gap ?? 12}px`, alignItems: "start" }}>
                      {row.cells.map((cell, col) => (
                        <Box
                          key={col}
                          onClick={(e) => {
                            if (mode !== "edit") return;
                            // Selecting the column (empty area) sets the target for the palette.
                            if (e.currentTarget === e.target) setSelected({ rowId: row.id, col, elId: "" });
                          }}
                          sx={{
                            // The min-height + padding are editor affordances so
                            // empty columns stay clickable/visible. In preview they
                            // add real reserved space (e.g. under the footer), so
                            // drop them there and let cells hug their content.
                            minHeight: mode === "edit" ? 28 : 0,
                            outline: mode === "edit" ? "1px dotted rgba(0,0,0,0.12)" : "none",
                            outlineColor: selected?.rowId === row.id && selected?.col === col ? "primary.main" : undefined,
                            p: mode === "edit" ? 0.5 : 0,
                          }}
                        >
                          {cell.length === 0 && mode === "edit" && (
                            <Typography variant="caption" color="text.secondary">Columna vacía</Typography>
                          )}
                          {mode === "edit" ? (
                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd(row.id, col)}>
                              <SortableContext items={cell.map((e) => e.id)} strategy={verticalListSortingStrategy}>
                                {cell.map((el) => (
                                  <SortableElement
                                    key={el.id}
                                    element={el}
                                    snapshot={snapshot}
                                    selected={selected?.elId === el.id}
                                    onSelect={() => setSelected({ rowId: row.id, col, elId: el.id })}
                                    onMoveUp={() => moveElement(row.id, col, el.id, -1)}
                                    onMoveDown={() => moveElement(row.id, col, el.id, 1)}
                                    onDuplicate={() => duplicateElement(row.id, col, el.id)}
                                    onRemove={() => removeElement(row.id, col, el.id)}
                                  />
                                ))}
                              </SortableContext>
                            </DndContext>
                          ) : (
                            cell.map((el) => (
                              <TemplateElementView key={el.id} element={el} snapshot={snapshot} mode="preview" />
                            ))
                          )}
                        </Box>
                      ))}
                    </Box>
                  </Box>
                ))}
              </Stack>
            </Paper>
          </Box>
        </Box>

        {/* Properties panel (edit mode only) */}
        {mode === "edit" && (
          <Paper variant="outlined" sx={{ p: 1.5, width: 260, flexShrink: 0, position: "sticky", top: 132, maxHeight: "80vh", overflow: "auto" }}>
            <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Propiedades</Typography>
              {(selectedElement && (selectedElement.type === "title" || selectedElement.type === "text" || selectedElement.type === "image" || "heading" in selectedElement)) && (
                <Button size="small" onClick={(e) => setTokenMenu(e.currentTarget)}>Insertar token</Button>
              )}
            </Box>
            <Divider sx={{ mb: 1.5 }} />
            <TemplatePropertiesPanel
              element={selectedElement}
              row={selectedRow}
              onChangeElement={(patch) => selected && selectedElement && updateElement(selected.rowId, selected.col, selectedElement.id, patch)}
              onChangeRow={(patch) => selectedRow && updateRow(selectedRow.id, patch)}
            />
          </Paper>
        )}
      </Box>

      {/* Token insert menu */}
      <Menu anchorEl={tokenMenu} open={Boolean(tokenMenu)} onClose={() => setTokenMenu(null)} slotProps={{ paper: { sx: { maxHeight: 380 } } }}>
        {Object.entries(tokenGroups).flatMap(([group, items]) => [
          <ListSubheader key={`h-${group}`} sx={{ lineHeight: "28px" }}>{group}</ListSubheader>,
          ...items.map((tk) => (
            <MenuItem key={tk.token} onClick={() => insertToken(tk.token)} sx={{ fontSize: 13 }}>
              {tk.label} <Box component="code" sx={{ ml: 1, color: "text.secondary", fontSize: 11 }}>{tk.token}</Box>
            </MenuItem>
          )),
        ])}
      </Menu>

      <ConfirmDialog
        open={confirmPublish}
        title="Publicar plantilla"
        description="Esta plantilla quedará como la publicada (solo puede haber una). Aún no se conecta a la generación de PDF. ¿Continuar?"
        confirmLabel={saving ? "Publicando..." : "Publicar"}
        onConfirm={() => save(true)}
        onCancel={() => setConfirmPublish(false)}
      />

      <Snackbar open={Boolean(snack)} autoHideDuration={4000} onClose={() => setSnack(null)} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
        {snack ? <Alert severity={snack.error ? "error" : "success"} variant="filled" onClose={() => setSnack(null)}>{snack.msg}</Alert> : undefined}
      </Snackbar>
    </>
  );
}

/** One draggable/sortable element inside a column (edit mode). */
function SortableElement({
  element,
  snapshot,
  selected,
  onSelect,
  onMoveUp,
  onMoveDown,
  onDuplicate,
  onRemove,
}: {
  element: TemplateElement;
  snapshot: ReturnType<typeof sampleSnapshot>;
  selected: boolean;
  onSelect: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDuplicate: () => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: element.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };
  return (
    <Box
      ref={setNodeRef}
      style={style}
      onClick={(e) => { e.stopPropagation(); onSelect(); }}
      sx={{
        position: "relative",
        outline: selected ? "2px solid" : "1px solid transparent",
        outlineColor: selected ? "primary.main" : "transparent",
        borderRadius: 1,
        cursor: "pointer",
        "&:hover .elTools": { opacity: 1 },
      }}
    >
      <Box className="elTools" sx={{ position: "absolute", top: -10, right: -6, opacity: selected ? 1 : 0, transition: "0.15s", display: "flex", gap: 0.25, bgcolor: "background.paper", borderRadius: 1, boxShadow: 1, zIndex: 4 }}>
        <IconButton size="small" {...attributes} {...listeners} sx={{ cursor: "grab" }} aria-label="Arrastrar"><DragIndicatorRoundedIcon sx={{ fontSize: 14 }} /></IconButton>
        <IconButton size="small" onClick={(e) => { e.stopPropagation(); onMoveUp(); }}><ArrowUpwardRoundedIcon sx={{ fontSize: 14 }} /></IconButton>
        <IconButton size="small" onClick={(e) => { e.stopPropagation(); onMoveDown(); }}><ArrowDownwardRoundedIcon sx={{ fontSize: 14 }} /></IconButton>
        <IconButton size="small" onClick={(e) => { e.stopPropagation(); onDuplicate(); }}><ContentCopyRoundedIcon sx={{ fontSize: 14 }} /></IconButton>
        <IconButton size="small" color="error" onClick={(e) => { e.stopPropagation(); onRemove(); }}><DeleteOutlineRoundedIcon sx={{ fontSize: 14 }} /></IconButton>
      </Box>
      <TemplateElementView element={element} snapshot={snapshot} mode="edit" />
    </Box>
  );
}
