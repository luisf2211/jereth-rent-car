"use client";

import * as React from "react";
import Fab from "@mui/material/Fab";
import Tooltip from "@mui/material/Tooltip";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

interface Props {
  whatsappNumber: string;
}

/**
 * Global floating WhatsApp button. Fixed bottom-right, above content but not
 * blocking it, safe-area aware for mobile. data-wa-source lets the future
 * central tracker attribute this conversion.
 */
export default function FloatingWhatsApp({ whatsappNumber }: Props) {
  if (!whatsappNumber) return null;

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
          zIndex: (theme) => theme.zIndex.snackbar + 1,
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
