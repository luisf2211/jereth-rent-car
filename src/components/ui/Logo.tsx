import * as React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import DirectionsCarFilledRoundedIcon from "@mui/icons-material/DirectionsCarFilledRounded";
import { getCompanySettings } from "@/lib/branding";

interface LogoProps {
  /** Render on a dark surface (e.g. footer). */
  variant?: "default" | "onDark";
  size?: "small" | "medium";
}

/**
 * Brand logo. Uses the configured logoUrl when present, otherwise falls back
 * to an icon + company name. Reads from the central branding source so it
 * stays correct once branding comes from the database.
 */
export default function Logo({ variant = "default", size = "medium" }: LogoProps) {
  const { companyName, logoUrl } = getCompanySettings();
  const onDark = variant === "onDark";
  const fontSize = size === "small" ? "1.05rem" : "1.25rem";

  if (logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logoUrl}
        alt={companyName}
        style={{ height: size === "small" ? 28 : 34, width: "auto", display: "block" }}
      />
    );
  }

  return (
    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}>
      <DirectionsCarFilledRoundedIcon
        sx={{ color: "primary.main", fontSize: size === "small" ? 26 : 30 }}
      />
      <Typography
        component="span"
        sx={{
          fontWeight: 800,
          fontSize,
          letterSpacing: "-0.02em",
          color: onDark ? "common.white" : "text.primary",
          whiteSpace: "nowrap",
        }}
      >
        {companyName}
      </Typography>
    </Box>
  );
}
