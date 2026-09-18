"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import ToggleOnRoundedIcon from "@mui/icons-material/ToggleOnRounded";
import ToggleOffRoundedIcon from "@mui/icons-material/ToggleOffRounded";
import EmptyState from "@/components/ui/EmptyState";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import UserStatusChip from "./UserStatusChip";
import type { UserListItem } from "@/features/users/types";
import { toggleUserActive } from "@/features/users/actions";

interface UsersListProps {
  users: UserListItem[];
  /** Whether to show row actions (edit / activate-deactivate). */
  canManage?: boolean;
}

type ToggleTarget = { id: string; name: string; nextActive: boolean } | null;

/**
 * Responsive users list.
 * - md and up: DataGrid.
 * - below md: cards with an actions menu (touch-friendly).
 */
export default function UsersList({ users, canManage = true }: UsersListProps) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const router = useRouter();

  const [menuAnchor, setMenuAnchor] = React.useState<null | HTMLElement>(null);
  const [menuUser, setMenuUser] = React.useState<UserListItem | null>(null);
  const [confirmTarget, setConfirmTarget] = React.useState<ToggleTarget>(null);
  const [pending, setPending] = React.useState(false);
  const [snack, setSnack] = React.useState<{ msg: string; error?: boolean } | null>(null);

  const openMenu = (e: React.MouseEvent<HTMLElement>, user: UserListItem) => {
    setMenuAnchor(e.currentTarget);
    setMenuUser(user);
  };
  const closeMenu = () => {
    setMenuAnchor(null);
    setMenuUser(null);
  };

  const goEdit = (id: string) => {
    closeMenu();
    router.push(`/admin/users/${id}`);
  };

  const askToggle = (user: UserListItem) => {
    setConfirmTarget({ id: user.id, name: user.name, nextActive: !user.isActive });
    closeMenu();
  };

  const doToggle = async () => {
    if (!confirmTarget) return;
    setPending(true);
    const res = await toggleUserActive(confirmTarget.id, confirmTarget.nextActive);
    setPending(false);
    setConfirmTarget(null);
    setSnack({ msg: res.message ?? "", error: !res.ok });
    if (res.ok) router.refresh();
  };

  if (users.length === 0) {
    return (
      <EmptyState
        title="Aún no hay usuarios"
        description="Crea el primer usuario con el botón “Nuevo usuario”."
      />
    );
  }

  const columns: GridColDef<UserListItem>[] = [
    { field: "name", headerName: "Nombre", flex: 1, minWidth: 160 },
    { field: "email", headerName: "Email", flex: 1.3, minWidth: 200 },
    { field: "roleName", headerName: "Rol", flex: 0.8, minWidth: 130 },
    {
      field: "isActive",
      headerName: "Estado",
      width: 120,
      sortable: false,
      renderCell: (params) => <UserStatusChip isActive={params.row.isActive} />,
    },
    {
      field: "actions",
      headerName: "",
      width: 60,
      sortable: false,
      filterable: false,
      align: "right",
      renderCell: (params) =>
        canManage ? (
          <IconButton aria-label="Acciones" onClick={(e) => openMenu(e, params.row)}>
            <MoreVertRoundedIcon />
          </IconButton>
        ) : null,
    },
  ];

  return (
    <>
      {isDesktop ? (
        <Card>
          <DataGrid
            rows={users}
            columns={columns}
            disableRowSelectionOnClick
            initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
            pageSizeOptions={[10, 25, 50]}
            sx={{ border: 0, "& .MuiDataGrid-columnHeaders": { bgcolor: "grey.50" } }}
            autoHeight
          />
        </Card>
      ) : (
        <Stack spacing={2}>
          {users.map((user) => (
            <Card key={user.id}>
              <CardContent>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 600 }} noWrap>
                      {user.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" noWrap>
                      {user.email}
                    </Typography>
                  </Box>
                  {canManage && (
                    <IconButton aria-label="Acciones" onClick={(e) => openMenu(e, user)}>
                      <MoreVertRoundedIcon />
                    </IconButton>
                  )}
                </Box>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1.5 }}>
                  <UserStatusChip isActive={user.isActive} />
                  <Typography variant="body2" color="text.secondary">
                    {user.roleName}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={closeMenu}>
        <MenuItem onClick={() => menuUser && goEdit(menuUser.id)}>
          <ListItemIcon>
            <EditRoundedIcon fontSize="small" />
          </ListItemIcon>
          Editar
        </MenuItem>
        <MenuItem onClick={() => menuUser && askToggle(menuUser)}>
          <ListItemIcon>
            {menuUser?.isActive ? (
              <ToggleOffRoundedIcon fontSize="small" />
            ) : (
              <ToggleOnRoundedIcon fontSize="small" />
            )}
          </ListItemIcon>
          {menuUser?.isActive ? "Desactivar" : "Activar"}
        </MenuItem>
      </Menu>

      <ConfirmDialog
        open={Boolean(confirmTarget)}
        title={confirmTarget?.nextActive ? "Activar usuario" : "Desactivar usuario"}
        description={
          confirmTarget
            ? `¿Seguro que deseas ${confirmTarget.nextActive ? "activar" : "desactivar"} a ${confirmTarget.name}?`
            : undefined
        }
        confirmLabel={pending ? "Guardando..." : "Confirmar"}
        confirmColor={confirmTarget?.nextActive ? "primary" : "error"}
        onConfirm={doToggle}
        onCancel={() => setConfirmTarget(null)}
      />

      <Snackbar
        open={Boolean(snack)}
        autoHideDuration={4000}
        onClose={() => setSnack(null)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        {snack ? (
          <Alert severity={snack.error ? "error" : "success"} onClose={() => setSnack(null)} variant="filled">
            {snack.msg}
          </Alert>
        ) : undefined}
      </Snackbar>
    </>
  );
}
