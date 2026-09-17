"use client";

import * as React from "react";
import NextLink from "next/link";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import Drawer from "@mui/material/Drawer";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemText from "@mui/material/ListItemText";
import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import Logo from "@/components/ui/Logo";
import WhatsAppButton from "@/components/ui/WhatsAppButton";
import { useBranding } from "@/components/branding/BrandingProvider";
import { PUBLIC_NAV_LINKS } from "./nav-links";

/**
 * Public site header.
 * Desktop: horizontal nav + WhatsApp CTA.
 * Mobile: logo + menu button opening a Drawer.
 * Client component because it manages the drawer open state.
 */
export default function PublicHeader() {
  const { companyName, logoUrl, whatsappNumber } = useBranding();
  const [open, setOpen] = React.useState(false);
  const ctaMessage = "Hola, quiero información para rentar un vehículo.";

  return (
    <AppBar position="sticky">
      <Container>
        <Toolbar disableGutters sx={{ gap: 2, minHeight: { xs: 64, md: 72 } }}>
          <Box component={NextLink} href="/" sx={{ display: "flex", alignItems: "center" }}>
            <Logo companyName={companyName} logoUrl={logoUrl} />
          </Box>

          {/* Desktop navigation */}
          <Box
            component="nav"
            sx={{ display: { xs: "none", md: "flex" }, gap: 0.5, ml: 3, flexGrow: 1 }}
          >
            {PUBLIC_NAV_LINKS.map((link) => (
              <Button
                key={link.href}
                component={NextLink}
                href={link.href}
                color="secondary"
                sx={{ color: "text.primary" }}
              >
                {link.label}
              </Button>
            ))}
          </Box>

          <Box sx={{ display: { xs: "none", md: "block" }, ml: "auto" }}>
            <WhatsAppButton phoneNumber={whatsappNumber} message={ctaMessage} />
          </Box>

          {/* Mobile menu button */}
          <IconButton
            aria-label="Abrir menú"
            edge="end"
            onClick={() => setOpen(true)}
            sx={{ display: { xs: "inline-flex", md: "none" }, ml: "auto" }}
          >
            <MenuRoundedIcon />
          </IconButton>
        </Toolbar>
      </Container>

      <Drawer anchor="right" open={open} onClose={() => setOpen(false)}>
        <Box sx={{ width: 280, p: 2, display: "flex", flexDirection: "column", height: "100%" }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
            <Logo companyName={companyName} logoUrl={logoUrl} size="small" />
            <IconButton aria-label="Cerrar menú" onClick={() => setOpen(false)}>
              <CloseRoundedIcon />
            </IconButton>
          </Box>
          <List sx={{ flexGrow: 1 }}>
            {PUBLIC_NAV_LINKS.map((link) => (
              <ListItem key={link.href} disablePadding>
                <ListItemButton
                  component={NextLink}
                  href={link.href}
                  onClick={() => setOpen(false)}
                >
                  <ListItemText primary={link.label} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
          <WhatsAppButton
            phoneNumber={whatsappNumber}
            message={ctaMessage}
            fullWidth
            size="large"
          />
        </Box>
      </Drawer>
    </AppBar>
  );
}
