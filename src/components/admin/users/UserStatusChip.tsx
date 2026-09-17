import * as React from "react";
import Chip from "@mui/material/Chip";

/** Small active/inactive status chip, shared by table and cards. */
export default function UserStatusChip({ isActive }: { isActive: boolean }) {
  return (
    <Chip
      label={isActive ? "Activo" : "Inactivo"}
      size="small"
      color={isActive ? "success" : "default"}
      variant={isActive ? "filled" : "outlined"}
    />
  );
}
