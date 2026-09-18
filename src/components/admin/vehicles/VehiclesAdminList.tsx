"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
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
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";
import EmptyState from "@/components/ui/EmptyState";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import type { VehicleAdminItem } from "@/features/vehicles/admin-data";
import { toggleVehicleActive } from "@/features/vehicles/actions";
import { formatDailyPrice, transmissionLabel, vehicleTitleWithYear, categoryLabel } from "@/features/vehicles/format";

interface Props {
  vehicles: VehicleAdminItem[];
}

type ToggleTarget = { id: string; title: string; nextActive: boolean } | null;

function StatusChip({ isActive }: { isActive: boolean }) {
  return (
    <Chip
      label={isActive ? "Publicado" : "Oculto"}
      size="small"
      color={isActive ? "success" : "default"}
      variant={isActive ? "filled" : "outlined"}
    />
  );
}

/**
 * Responsive vehicles list for the backoffice.
 * DataGrid on desktop, cards on mobile/tablet.
 */
export default function VehiclesAdminList({ vehicles }: Props) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("md"));
  const router = useRouter();

  const [menuAnchor, setMenuAnchor] = React.useState<null | HTMLElement>(null);
  const [menuItem, setMenuItem] = React.useState<VehicleAdminItem | null>(null);
  const [confirmTarget, setConfirmTarget] = React.useState<ToggleTarget>(null);
  const [snack, setSnack] = React.useState<{ msg: string; error?: boolean } | null>(null);

  const openMenu = (e: React.MouseEvent<HTMLElement>, v: VehicleAdminItem) => {
    setMenuAnchor(e.currentTarget);
    setMenuItem(v);
  };
  const closeMenu = () => {
    setMenuAnchor(null);
    setMenuItem(null);
  };

  const goEdit = (id: string) => {
    closeMenu();
    router.push(`/admin/vehicles/${id}`);
  };

  const askToggle = (v: VehicleAdminItem) => {
    setConfirmTarget({ id: v.id, title: vehicleTitleWithYear(v), nextActive: !v.isActive });
    closeMenu();
  };

  const doToggle = async () => {
    if (!confirmTarget) return;
    const res = await toggleVehicleActive(confirmTarget.id, confirmTarget.nextActive);
    setConfirmTarget(null);
    setSnack({ msg: res.message ?? "", error: !res.ok });
    if (res.ok) router.refresh();
  };

  if (vehicles.length === 0) {
    return (
      <EmptyState
        title="Aún no hay vehículos"
        description="Agrega el primer vehículo con el botón “Nuevo vehículo”."
      />
    );
  }

  const columns: GridColDef<VehicleAdminItem>[] = [
    {
      field: "imageUrl",
      headerName: "",
      width: 72,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <Avatar variant="rounded" src={params.row.imageUrl} alt="" sx={{ width: 48, height: 40 }} />
      ),
    },
    {
      field: "brand",
      headerName: "Vehículo",
      flex: 1.2,
      minWidth: 180,
      renderCell: (params) => vehicleTitleWithYear(params.row),
    },
    {
      field: "category",
      headerName: "Categoría",
      flex: 0.7,
      minWidth: 120,
      renderCell: (params) => categoryLabel(params.row.category),
    },
    {
      field: "transmission",
      headerName: "Transmisión",
      flex: 0.8,
      minWidth: 130,
      renderCell: (params) => transmissionLabel(params.row.transmission),
    },
    { field: "passengers", headerName: "Pasajeros", width: 110 },
    {
      field: "dailyPrice",
      headerName: "Precio/día",
      width: 120,
      renderCell: (params) => formatDailyPrice(params.row.dailyPrice),
    },
    {
      field: "isActive",
      headerName: "Estado",
      width: 130,
      sortable: false,
      renderCell: (params) => <StatusChip isActive={params.row.isActive} />,
    },
    {
      field: "actions",
      headerName: "",
      width: 60,
      sortable: false,
      filterable: false,
      align: "right",
      renderCell: (params) => (
        <IconButton aria-label="Acciones" onClick={(e) => openMenu(e, params.row)}>
          <MoreVertRoundedIcon />
        </IconButton>
      ),
    },
  ];

  return (
    <>
      {isDesktop ? (
        <Card>
          <DataGrid
            rows={vehicles}
            columns={columns}
            disableRowSelectionOnClick
            initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
            pageSizeOptions={[10, 25, 50]}
            rowHeight={56}
            sx={{ border: 0, "& .MuiDataGrid-columnHeaders": { bgcolor: "grey.50" } }}
            autoHeight
          />
        </Card>
      ) : (
        <Stack spacing={2}>
          {vehicles.map((v) => (
            <Card key={v.id}>
              <CardContent>
                <Box sx={{ display: "flex", gap: 2 }}>
                  <Avatar variant="rounded" src={v.imageUrl} alt="" sx={{ width: 72, height: 60 }} />
                  <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                    <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600 }} noWrap>
                        {vehicleTitleWithYear(v)}
                      </Typography>
                      <IconButton aria-label="Acciones" size="small" onClick={(e) => openMenu(e, v)}>
                        <MoreVertRoundedIcon />
                      </IconButton>
                    </Box>
                    <Typography variant="body2" color="text.secondary">
                      {transmissionLabel(v.transmission)} · {v.passengers} pasajeros
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 1 }}>
                      <Typography variant="subtitle2" color="primary.main">
                        {formatDailyPrice(v.dailyPrice)} / día
                      </Typography>
                      <StatusChip isActive={v.isActive} />
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}

      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={closeMenu}>
        <MenuItem onClick={() => menuItem && goEdit(menuItem.id)}>
          <ListItemIcon>
            <EditRoundedIcon fontSize="small" />
          </ListItemIcon>
          Editar
        </MenuItem>
        <MenuItem onClick={() => menuItem && askToggle(menuItem)}>
          <ListItemIcon>
            {menuItem?.isActive ? (
              <VisibilityOffRoundedIcon fontSize="small" />
            ) : (
              <VisibilityRoundedIcon fontSize="small" />
            )}
          </ListItemIcon>
          {menuItem?.isActive ? "Ocultar" : "Publicar"}
        </MenuItem>
      </Menu>

      <ConfirmDialog
        open={Boolean(confirmTarget)}
        title={confirmTarget?.nextActive ? "Publicar vehículo" : "Ocultar vehículo"}
        description={
          confirmTarget
            ? `¿Deseas ${confirmTarget.nextActive ? "publicar" : "ocultar"} el ${confirmTarget.title}?`
            : undefined
        }
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
          <Alert severity={snack.error ? "error" : "success"} variant="filled" onClose={() => setSnack(null)}>
            {snack.msg}
          </Alert>
        ) : undefined}
      </Snackbar>
    </>
  );
}
