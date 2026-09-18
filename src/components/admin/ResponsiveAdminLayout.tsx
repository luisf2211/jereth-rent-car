"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import Toolbar from "@mui/material/Toolbar";
import Container from "@mui/material/Container";
import AdminSidebar from "./AdminSidebar";
import AdminAppBar from "./AdminAppBar";
import { ADMIN_DRAWER_WIDTH } from "./nav-items";
import type { Permission } from "@/lib/permissions";

/**
 * Responsive backoffice shell.
 * - md and up: permanent sidebar + app bar (desktop / tablet landscape).
 * - below md: app bar + temporary drawer (tablet portrait / mobile).
 *
 * Client component because it owns the mobile drawer open state.
 */
export default function ResponsiveAdminLayout({
  children,
  userName,
  userEmail,
  permissions,
}: {
  children: React.ReactNode;
  userName: string;
  userEmail: string;
  permissions: Permission[];
}) {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const drawerStyles = {
    "& .MuiDrawer-paper": {
      boxSizing: "border-box",
      width: ADMIN_DRAWER_WIDTH,
      borderRight: "1px solid",
      borderColor: "divider",
      bgcolor: "background.paper",
    },
  } as const;

  return (
    <Box sx={{ display: "flex", minHeight: "100dvh", bgcolor: "grey.50" }}>
      <AdminAppBar onMenuClick={() => setMobileOpen(true)} userName={userName} userEmail={userEmail} />

      {/* Navigation drawers */}
      <Box
        component="nav"
        sx={{ width: { md: ADMIN_DRAWER_WIDTH }, flexShrink: { md: 0 } }}
        aria-label="Navegación administrativa"
      >
        {/* Temporary drawer (mobile / tablet portrait) */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: "block", md: "none" }, ...drawerStyles }}
        >
          <AdminSidebar onNavigate={() => setMobileOpen(false)} permissions={permissions} />
        </Drawer>

        {/* Permanent drawer (desktop / tablet landscape) */}
        <Drawer
          variant="permanent"
          open
          sx={{ display: { xs: "none", md: "block" }, ...drawerStyles }}
        >
          <AdminSidebar permissions={permissions} />
        </Drawer>
      </Box>

      {/* Main content */}
      <Box component="main" sx={{ flexGrow: 1, width: { md: `calc(100% - ${ADMIN_DRAWER_WIDTH}px)` } }}>
        <Toolbar /> {/* spacer for the fixed app bar */}
        <Container maxWidth="lg" sx={{ py: { xs: 3, md: 4 } }}>
          {children}
        </Container>
      </Box>
    </Box>
  );
}
