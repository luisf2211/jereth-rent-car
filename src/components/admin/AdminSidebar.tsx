"use client";

import * as React from "react";
import NextLink from "next/link";
import { usePathname } from "next/navigation";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import Logo from "@/components/ui/Logo";
import { useBranding } from "@/components/branding/BrandingProvider";
import { ADMIN_NAV_ITEMS } from "./nav-items";
import type { Permission } from "@/lib/permissions";

interface AdminSidebarProps {
  /** Called after navigation (used to close the temporary drawer on mobile). */
  onNavigate?: () => void;
  /** Current user's permissions — used to hide modules without access. */
  permissions: Permission[];
}

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Sidebar contents shared by the permanent (desktop) and temporary (mobile)
 * drawers. Highlights the active route.
 */
export default function AdminSidebar({ onNavigate, permissions }: AdminSidebarProps) {
  const pathname = usePathname();
  const { companyName, logoUrl } = useBranding();
  const permSet = React.useMemo(() => new Set(permissions), [permissions]);
  const visibleItems = ADMIN_NAV_ITEMS.filter(
    (item) => !item.permission || permSet.has(item.permission)
  );

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <Toolbar sx={{ px: 2.5 }}>
        <Box component={NextLink} href="/admin" sx={{ display: "flex", alignItems: "center" }}>
          <Logo companyName={companyName} logoUrl={logoUrl} display="name" />
        </Box>
      </Toolbar>
      <List sx={{ px: 1.5, flexGrow: 1 }}>
        {visibleItems.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <ListItem key={item.href} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                component={NextLink}
                href={item.href}
                onClick={onNavigate}
                selected={active}
                sx={{
                  borderRadius: 2,
                  "&.Mui-selected": {
                    bgcolor: "primary.main",
                    color: "primary.contrastText",
                    "& .MuiListItemIcon-root": { color: "primary.contrastText" },
                    "&:hover": { bgcolor: "primary.dark" },
                  },
                }}
              >
                <ListItemIcon sx={{ minWidth: 40, color: active ? "inherit" : "text.secondary" }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.label} slotProps={{ primary: { sx: { fontWeight: 600 } } }} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );
}
