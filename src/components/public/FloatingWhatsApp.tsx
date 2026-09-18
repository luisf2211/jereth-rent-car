"use client";

import * as React from "react";
import { usePathname } from "next/navigation";
import Fab from "@mui/material/Fab";
import Tooltip from "@mui/material/Tooltip";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

interface Props {
  whatsappNumber: string;
}

/**
 * Global floating WhatsApp button. Fixed bottom-right, safe-area aware.
 *
 * On vehicle detail pages the mobile layout already has a fixed "Reservar"
 * bottom bar, so on small screens we hide this button there to avoid overlap.
 * On desktop (no bar) it stays visible everywhere.
 */
export default function FloatingWhatsApp({ whatsappNumber }: Props) {
  const pathname = usePathname();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  if (!whatsappNumber) return null;

  // Vehicle detail route: /vehicles/<id> (but not the /vehicles list).
  const isVehicleDetail = /^\/vehicles\/[^/]+$/.test(pathname);
  if (isVehicleDetail && isMobile) return null;

  const href = buildWhatsAppUrl(
    whatsappNumber,
    "Hola Jereth Rent Car, quisiera información para rentar un vehículo."
  );

  return (
    <Tooltip title="Escríbenos por WhatsApp" placement="left">
      <Fab
        component="a"
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="WhatsApp"
        data-wa-source="floating_button"
        sx={{
          position: "fixed",
          right: { xs: 16, md: 24 },
          bottom: { xs: "calc(16px + env(safe-area-inset-bottom))", md: 24 },
          zIndex: (t) => t.zIndex.snackbar + 1,
          bgcolor: "#25D366",
          color: "#fff",
          "&:hover": { bgcolor: "#1EBE5B" },
        }}
      >
        <WhatsAppIcon />
      </Fab>
    </Tooltip>
  );
}
