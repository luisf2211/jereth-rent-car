import * as React from "react";
import Button from "@mui/material/Button";
import type { ButtonProps } from "@mui/material/Button";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";
import { buildWhatsAppUrl, type WhatsAppSource } from "@/lib/whatsapp";

interface WhatsAppButtonProps extends Omit<ButtonProps, "href" | "children"> {
  phoneNumber: string;
  message: string;
  label?: string;
  /** Where the CTA lives, exposed as data-wa-source for centralized tracking. */
  source?: WhatsAppSource;
  /** Extra context (e.g. vehicle name/category) for analytics. */
  context?: string;
}

/**
 * Reusable CTA that opens WhatsApp with a prefilled message.
 * The data-wa-* attributes let a single global listener report conversions
 * later (GA4/Ads) without embedding analytics logic in each component.
 */
export default function WhatsAppButton({
  phoneNumber,
  message,
  label = "Rentar por WhatsApp",
  variant = "contained",
  color = "primary",
  source,
  context,
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
      data-wa-source={source}
      data-wa-context={context}
      {...rest}
    >
      {label}
    </Button>
  );
}
