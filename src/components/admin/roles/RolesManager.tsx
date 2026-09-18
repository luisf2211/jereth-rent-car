"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import TextField from "@mui/material/TextField";
import FormControlLabel from "@mui/material/FormControlLabel";
import Checkbox from "@mui/material/Checkbox";
import Divider from "@mui/material/Divider";
import Alert from "@mui/material/Alert";
import Snackbar from "@mui/material/Snackbar";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import type { RoleListItem } from "@/features/roles/data";
import { createRole, updateRole, deleteRole } from "@/features/roles/actions";
import { PERMISSION_MODULES, type Permission } from "@/lib/permissions";

interface Props {
  roles: RoleListItem[];
  canManage: boolean;
}

export default function RolesManager({ roles, canManage }: Props) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<RoleListItem | null>(null);
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [perms, setPerms] = React.useState<Set<Permission>>(new Set());
  const [formError, setFormError] = React.useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = React.useState<Record<string, string>>({});
  const [saving, setSaving] = React.useState(false);
  const [deleteTarget, setDeleteTarget] = React.useState<RoleListItem | null>(null);
  const [snack, setSnack] = React.useState<{ msg: string; error?: boolean } | null>(null);

  const openNew = () => {
    setEditing(null);
    setName("");
    setDescription("");
    setPerms(new Set());
    setFieldErrors({});
    setFormError(null);
    setOpen(true);
  };

  const openEdit = (role: RoleListItem) => {
    setEditing(role);
    setName(role.name);
    setDescription(role.description ?? "");
    setPerms(new Set(role.permissions));
    setFieldErrors({});
    setFormError(null);
    setOpen(true);
  };

  const togglePerm = (key: Permission) => {
    setPerms((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleModule = (moduleKey: string, allKeys: Permission[], allOn: boolean) => {
    setPerms((prev) => {
      const next = new Set(prev);
      for (const k of allKeys) {
        if (allOn) next.delete(k);
        else next.add(k);
      }
      return next;
    });
  };

  const isSystem = editing?.isSystem ?? false;

  const submit = async () => {
    setSaving(true);
    setFormError(null);
    setFieldErrors({});
    const payload = { name, description, permissions: Array.from(perms) };
    const res = editing ? await updateRole(editing.id, payload) : await createRole(payload);
    setSaving(false);
    if (res.ok) {
      setOpen(false);
      setSnack({ msg: res.message ?? "Guardado." });
      router.refresh();
    } else {
      setFieldErrors(res.fieldErrors ?? {});
      setFormError(res.message);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const res = await deleteRole(deleteTarget.id);
    setDeleteTarget(null);
    setSnack({ msg: res.message ?? "", error: !res.ok });
    if (res.ok) router.refresh();
  };

  return (
    <>
      {canManage && (
        <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
          <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={openNew}>
            Nuevo rol
          </Button>
        </Box>
      )}

      <Stack spacing={2}>
        {roles.map((role) => (
          <Card key={role.id}>
            <CardContent>
              <Box sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
                <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
                    <Typography variant="h6" component="h3">
                      {role.name}
                    </Typography>
                    {role.isSystem && (
                      <Chip icon={<LockRoundedIcon />} label="Sistema" size="small" variant="outlined" />
                    )}
                    <Chip
                      label={`${role.userCount} usuario${role.userCount === 1 ? "" : "s"}`}
                      size="small"
                    />
                  </Box>
                  {role.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                      {role.description}
                    </Typography>
                  )}
                  <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                    {role.isSystem
                      ? "Acceso total (todos los permisos)"
                      : `${role.permissions.length} permiso(s)`}
                  </Typography>
                </Box>
                {canManage && (
                  <>
                    <IconButton aria-label="Editar" onClick={() => openEdit(role)}>
                      <EditRoundedIcon fontSize="small" />
                    </IconButton>
                    {!role.isSystem && (
                      <IconButton aria-label="Eliminar" onClick={() => setDeleteTarget(role)}>
                        <DeleteOutlineRoundedIcon fontSize="small" />
                      </IconButton>
                    )}
                  </>
                )}
              </Box>
            </CardContent>
          </Card>
        ))}
      </Stack>

      {/* Create / edit modal */}
      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editing ? "Editar rol" : "Nuevo rol"}</DialogTitle>
        <DialogContent>
          {formError && (
            <Alert severity="error" sx={{ mb: 2, mt: 1 }}>
              {formError}
            </Alert>
          )}
          {isSystem && (
            <Alert severity="info" sx={{ mb: 2, mt: 1 }}>
              El rol Administrator conserva todos los permisos y su nombre no se puede cambiar.
            </Alert>
          )}
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Nombre del rol"
              value={name}
              onChange={(e) => setName(e.target.value)}
              error={Boolean(fieldErrors.name)}
              helperText={fieldErrors.name}
              disabled={isSystem}
              fullWidth
            />
            <TextField
              label="Descripción (opcional)"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
            />
          </Stack>

          <Divider sx={{ my: 2.5 }} />
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Permisos por módulo
          </Typography>

          {isSystem ? (
            <Typography variant="body2" color="text.secondary">
              Este rol tiene acceso completo a todos los módulos.
            </Typography>
          ) : (
            <Stack spacing={2}>
              {PERMISSION_MODULES.map((mod) => {
                const keys = mod.permissions.map((p) => p.key);
                const allOn = keys.every((k) => perms.has(k));
                const someOn = keys.some((k) => perms.has(k));
                return (
                  <Box key={mod.key} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 2, p: 1.5 }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          checked={allOn}
                          indeterminate={!allOn && someOn}
                          onChange={() => toggleModule(mod.key, keys, allOn)}
                        />
                      }
                      label={<Typography sx={{ fontWeight: 700 }}>{mod.label}</Typography>}
                    />
                    <Box sx={{ pl: 3, display: "flex", flexDirection: "column" }}>
                      {mod.permissions.map((p) => (
                        <FormControlLabel
                          key={p.key}
                          control={
                            <Checkbox
                              size="small"
                              checked={perms.has(p.key)}
                              onChange={() => togglePerm(p.key)}
                            />
                          }
                          label={<Typography variant="body2">{p.label}</Typography>}
                        />
                      ))}
                    </Box>
                  </Box>
                );
              })}
            </Stack>
          )}
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
        title="Eliminar rol"
        description={deleteTarget ? `¿Eliminar el rol "${deleteTarget.name}"? Esta acción no se puede deshacer.` : undefined}
        confirmLabel="Eliminar"
        confirmColor="error"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
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
