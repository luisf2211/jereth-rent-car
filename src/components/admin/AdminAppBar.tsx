"use client";

import * as React from "react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Box from "@mui/material/Box";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";
import Avatar from "@mui/material/Avatar";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import Divider from "@mui/material/Divider";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import OpenInNewRoundedIcon from "@mui/icons-material/OpenInNewRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import { logoutAction } from "@/features/auth/actions";
import { ADMIN_DRAWER_WIDTH, ADMIN_NAV_ITEMS } from "./nav-items";

interface AdminAppBarProps {
  onMenuClick: () => void;
  userName: string;
  userEmail: string;
}

/** Human-readable labels for breadcrumb segments not covered by nav items. */
const SEGMENT_LABELS: Record<string, string> = {
  admin: "Dashboard",
  vehicles: "Vehículos",
  users: "Usuarios",
  roles: "Roles",
  settings: "Configuración",
  branding: "Branding",
  new: "Nuevo",
};

function buildBreadcrumbs(pathname: string) {
  const segments = pathname.split("/").filter(Boolean); // e.g. ["admin","users","new"]
  return segments.map((segment, index) => {
    const href = "/" + segments.slice(0, index + 1).join("/");
    const navMatch = ADMIN_NAV_ITEMS.find((i) => i.href === href);
    const label = navMatch?.label ?? SEGMENT_LABELS[segment] ?? segment;
    return { href, label, isLast: index === segments.length - 1 };
  });
}

/**
 * Top app bar for the backoffice: menu toggle (mobile/tablet), breadcrumbs
 * and an account menu. Offset to the right of the permanent sidebar on desktop.
 */
export default function AdminAppBar({ onMenuClick, userName, userEmail }: AdminAppBarProps) {
  const pathname = usePathname();
  const crumbs = buildBreadcrumbs(pathname);
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const avatarInitial = (userName || userEmail || "?").charAt(0).toUpperCase();

  return (
    <AppBar
      position="fixed"
      sx={{
        width: { md: `calc(100% - ${ADMIN_DRAWER_WIDTH}px)` },
        ml: { md: `${ADMIN_DRAWER_WIDTH}px` },
        zIndex: (theme) => theme.zIndex.drawer - 1,
      }}
    >
      <Toolbar sx={{ gap: 1 }}>
        <IconButton
          aria-label="Abrir menú"
          edge="start"
          onClick={onMenuClick}
          sx={{ display: { md: "none" } }}
        >
          <MenuRoundedIcon />
        </IconButton>

        <Breadcrumbs sx={{ flexGrow: 1 }} aria-label="breadcrumb">
          {crumbs.map((crumb) =>
            crumb.isLast ? (
              <Typography key={crumb.href} color="text.primary" sx={{ fontWeight: 600 }}>
                {crumb.label}
              </Typography>
            ) : (
              <Link
                key={crumb.href}
                component={NextLink}
                href={crumb.href}
                underline="hover"
                color="text.secondary"
              >
                {crumb.label}
              </Link>
            )
          )}
        </Breadcrumbs>

        <IconButton
          aria-label="Cuenta"
          onClick={(e) => setAnchorEl(e.currentTarget)}
          size="small"
        >
          <Avatar sx={{ width: 34, height: 34, bgcolor: "primary.main", fontSize: "0.95rem" }}>
            {avatarInitial}
          </Avatar>
        </IconButton>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={() => setAnchorEl(null)}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <Box sx={{ px: 2, py: 1 }}>
            <Typography variant="subtitle2" noWrap>
              {userName || "Usuario"}
            </Typography>
            <Typography variant="body2" color="text.secondary" noWrap>
              {userEmail}
            </Typography>
          </Box>
          <Divider />
          <MenuItem component="a" href="/" target="_blank" onClick={() => setAnchorEl(null)}>
            <ListItemIcon>
              <OpenInNewRoundedIcon fontSize="small" />
            </ListItemIcon>
            Ver sitio público
          </MenuItem>
          <MenuItem
            onClick={() => {
              setAnchorEl(null);
              void logoutAction();
            }}
          >
            <ListItemIcon>
              <LogoutRoundedIcon fontSize="small" />
            </ListItemIcon>
            Cerrar sesión
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
}
