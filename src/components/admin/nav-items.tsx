import * as React from "react";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import DirectionsCarFilledRoundedIcon from "@mui/icons-material/DirectionsCarFilledRounded";
import PeopleRoundedIcon from "@mui/icons-material/PeopleRounded";
import AdminPanelSettingsRoundedIcon from "@mui/icons-material/AdminPanelSettingsRounded";
import PaletteRoundedIcon from "@mui/icons-material/PaletteRounded";

export interface AdminNavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

/** Sidebar/drawer navigation for the backoffice. */
export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { label: "Dashboard", href: "/admin", icon: <DashboardRoundedIcon /> },
  { label: "Vehículos", href: "/admin/vehicles", icon: <DirectionsCarFilledRoundedIcon /> },
  { label: "Usuarios", href: "/admin/users", icon: <PeopleRoundedIcon /> },
  { label: "Roles", href: "/admin/roles", icon: <AdminPanelSettingsRoundedIcon /> },
  { label: "Branding", href: "/admin/settings/branding", icon: <PaletteRoundedIcon /> },
];

export const ADMIN_DRAWER_WIDTH = 264;
