import * as React from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import DirectionsCarFilledRoundedIcon from "@mui/icons-material/DirectionsCarFilledRounded";

interface LogoProps {
  companyName: string;
  logoUrl?: string | null;
  variant?: "default" | "onDark";
  /**
   * What to render:
   * - "name": wordmark only (used in the navbar).
   * - "logo": the uploaded logo image, larger (used in the footer). Falls back
   *   to the wordmark when no logo image is set.
   */
  display?: "name" | "logo";
  /** Size multiplier for the "logo" display (from branding.logoScale). */
  scale?: number;
  /** Base height in px for the "logo" image before scaling. */
  baseHeight?: number;
}

/**
 * Splits a trailing "Rent Car" into a small magenta kicker under the main
 * name for a cleaner wordmark.
 */
function splitName(companyName: string): { primary: string; kicker?: string } {
  const match = companyName.match(/^(.*?)[\s-]+(rent\s*a?\s*car)$/i);
  if (match) return { primary: match[1].trim(), kicker: match[2].toUpperCase() };
  return { primary: companyName };
}

/** Wordmark: company name with a subtle two-line hierarchy. */
function Wordmark({
  companyName,
  onDark,
  fontSize,
}: {
  companyName: string;
  onDark: boolean;
  fontSize: string | Record<string, string>;
}) {
  const { primary, kicker } = splitName(companyName);
  return (
    <Box sx={{ display: "flex", flexDirection: "column", lineHeight: 1, textDecoration: "none" }}>
      <Typography
        component="span"
        sx={{
          fontWeight: 800,
          fontSize,
          letterSpacing: "-0.01em",
          lineHeight: 1.05,
          color: onDark ? "common.white" : "text.primary",
          whiteSpace: "nowrap",
          textDecoration: "none",
        }}
      >
        {primary}
      </Typography>
      {kicker && (
        <Typography
          component="span"
          sx={{
            fontWeight: 700,
            fontSize: "0.66rem",
            letterSpacing: "0.28em",
            mt: 0.4,
            color: "primary.main",
            textDecoration: "none",
          }}
        >
          {kicker}
        </Typography>
      )}
    </Box>
  );
}

/**
 * Brand mark. `display="name"` (navbar) renders the wordmark; `display="logo"`
 * (footer) renders the uploaded logo large, scaled by branding.logoScale.
 */
export default function Logo({
  companyName,
  logoUrl,
  variant = "default",
  display = "name",
  scale = 1,
  baseHeight = 56,
}: LogoProps) {
  const onDark = variant === "onDark";

  if (display === "logo" && logoUrl) {
    const height = Math.round(baseHeight * Math.min(Math.max(scale, 0.8), 3));
    return (
      <Box
        component="img"
        src={logoUrl}
        alt={companyName}
        sx={{ height, width: "auto", maxWidth: "100%", objectFit: "contain", display: "block" }}
      />
    );
  }

  // Navbar / fallback: wordmark, with a small car icon only in the fallback.
  return (
    <Box sx={{ display: "inline-flex", alignItems: "center", gap: 1.25, textDecoration: "none" }}>
      {!logoUrl && (
        <Box
          sx={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 40,
            height: 40,
            borderRadius: 2.5,
            bgcolor: onDark ? "rgba(255,255,255,0.1)" : "rgba(230,0,122,0.1)",
            color: "primary.main",
            flexShrink: 0,
          }}
        >
          <DirectionsCarFilledRoundedIcon sx={{ fontSize: 24 }} />
        </Box>
      )}
      <Wordmark companyName={companyName} onDark={onDark} fontSize={{ xs: "1.2rem", md: "1.35rem" }} />
    </Box>
  );
}
