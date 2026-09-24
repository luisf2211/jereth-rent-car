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
import { useBranding } from "@/components/branding/BrandingProvider";
import { useI18n } from "@/i18n/LanguageProvider";
import LanguageSwitcher from "./LanguageSwitcher";
import { PUBLIC_NAV_LINKS } from "./nav-links";

/**
 * Public header. Solid black bar across the whole site, white text. Fixed to
 * the top. Client component: manages the mobile drawer. No WhatsApp CTA here —
 * WhatsApp lives on the vehicle cards/detail and the floating button.
 */
export default function PublicHeader() {
  const { companyName, logoUrl, navLogoScale } = useBranding();
  const { t } = useI18n();
  const [open, setOpen] = React.useState(false);

  return (
    <AppBar
      position="fixed"
      sx={{
        bgcolor: "#0A0A0A",
        color: "common.white",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <Container>
        <Toolbar disableGutters sx={{ gap: 2, minHeight: { xs: 64, md: 76 } }}>
          <Box component={NextLink} href="/" sx={{ display: "flex", alignItems: "center", textDecoration: "none" }}>
            <Logo companyName={companyName} logoUrl={logoUrl} variant="onDark" display="name" scale={navLogoScale} />
          </Box>

          <Box
            component="nav"
            sx={{ display: { xs: "none", md: "flex" }, gap: 0.5, flexGrow: 1, justifyContent: "center" }}
          >
            {PUBLIC_NAV_LINKS.map((link) => (
              <Button
                key={link.href}
                component={NextLink}
                href={link.href}
                sx={{
                  color: "common.white",
                  fontWeight: 600,
                  "&:hover": { bgcolor: "rgba(255,255,255,0.12)" },
                }}
              >
                {t(link.labelKey)}
              </Button>
            ))}
          </Box>

          {/* Desktop language switcher, right-aligned. */}
          <Box sx={{ display: { xs: "none", md: "inline-flex" }, ml: "auto" }}>
            <LanguageSwitcher variant="onDark" />
          </Box>

          {/*
            Mobile: language switcher + menu button grouped on the right so the
            user can switch ES/EN without opening the menu. The switcher stays
            compact and matches the dark header; the wrapper owns the right
            alignment (ml:auto) and the gap between the two controls.
          */}
          <Box
            sx={{
              display: { xs: "inline-flex", md: "none" },
              ml: "auto",
              alignItems: "center",
              gap: 1,
            }}
          >
            <LanguageSwitcher variant="onDark" />
            <IconButton
              aria-label={t("nav.openMenu")}
              edge="end"
              onClick={() => setOpen(true)}
              sx={{ color: "common.white" }}
            >
              <MenuRoundedIcon />
            </IconButton>
          </Box>
        </Toolbar>
      </Container>

      <Drawer anchor="right" open={open} onClose={() => setOpen(false)}>
        <Box sx={{ width: 300, p: 2, display: "flex", flexDirection: "column", height: "100%" }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
            <Logo companyName={companyName} logoUrl={logoUrl} display="name" scale={navLogoScale} />
            <IconButton aria-label={t("nav.closeMenu")} onClick={() => setOpen(false)}>
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
                  sx={{ borderRadius: 2 }}
                >
                  <ListItemText primary={t(link.labelKey)} slotProps={{ primary: { sx: { fontWeight: 600 } } }} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
    </AppBar>
  );
}
