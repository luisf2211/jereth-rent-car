import * as React from "react";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import DirectionsCarFilledRoundedIcon from "@mui/icons-material/DirectionsCarFilledRounded";
import ArticleRoundedIcon from "@mui/icons-material/ArticleRounded";
import PlaceRoundedIcon from "@mui/icons-material/PlaceRounded";
import PeopleRoundedIcon from "@mui/icons-material/PeopleRounded";
import AdminPanelSettingsRoundedIcon from "@mui/icons-material/AdminPanelSettingsRounded";
import PaletteRoundedIcon from "@mui/icons-material/PaletteRounded";
import EventNoteRoundedIcon from "@mui/icons-material/EventNoteRounded";

import type { Permission } from "@/lib/permissions";

export interface AdminNavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  /** Permission required to see this item. Undefined = always visible. */
  permission?: Permission;
}

/** Sidebar/drawer navigation for the backoffice. */
export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  { label: "Dashboard", href: "/admin", icon: <DashboardRoundedIcon /> },
  { label: "Vehículos", href: "/admin/vehicles", icon: <DirectionsCarFilledRoundedIcon />, permission: "vehicles.view" },
  { label: "Contenido", href: "/admin/content", icon: <ArticleRoundedIcon />, permission: "content.view" },
  { label: "Lugares de entrega", href: "/admin/delivery", icon: <PlaceRoundedIcon />, permission: "delivery.view" },
  { label: "Reservas", href: "/admin/reservations", icon: <EventNoteRoundedIcon />, permission: "reservations.view" },
  { label: "Usuarios", href: "/admin/users", icon: <PeopleRoundedIcon />, permission: "users.view" },
  { label: "Roles", href: "/admin/roles", icon: <AdminPanelSettingsRoundedIcon />, permission: "roles.view" },
  { label: "Branding", href: "/admin/settings/branding", icon: <PaletteRoundedIcon />, permission: "branding.view" },
];

export const ADMIN_DRAWER_WIDTH = 264;
