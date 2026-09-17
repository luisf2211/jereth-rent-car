import * as React from "react";
import Button from "@mui/material/Button";
import type { ButtonProps } from "@mui/material/Button";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import { buildWhatsAppUrl } from "@/lib/whatsapp";

interface WhatsAppButtonProps extends Omit<ButtonProps, "href" | "children"> {
  phoneNumber: string;
  message: string;
  label?: string;
}

/**
 * Reusable CTA that opens WhatsApp with a prefilled message.
 * Used across the header, hero, vehicle cards and final CTA.
 */
export default function WhatsAppButton({
  phoneNumber,
  message,
  label = "Rentar por WhatsApp",
  variant = "contained",
  color = "primary",
  ...rest
}: WhatsAppButtonProps) {
  const href = buildWhatsAppUrl(phoneNumber, message);

  return (
    <Button
      component="a"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      variant={variant}
      color={color}
      startIcon={<WhatsAppIcon />}
      {...rest}
    >
      {label}
    </Button>
  );
}
