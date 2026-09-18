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
  if (match) return { primary: match[1].trim(), kicker: "Rent Car" };
  return { primary: companyName };
}

/**
 * Wordmark on a single line: the brand name in a strong weight and the
 * "Rent Car" descriptor in a lighter weight + magenta, sharing the same line
 * for a tidy, considered lockup (no stacked labels).
 */
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
    <Typography
      component="span"
      className="jereth-wordmark"
      sx={{
        fontSize,
        lineHeight: 1,
        letterSpacing: "-0.01em",
        whiteSpace: "nowrap",
        textDecoration: "none",
        color: onDark ? "common.white" : "text.primary",
        display: "inline-flex",
        alignItems: "baseline",
        gap: 0.6,
        // Subtle brand-color tint on hover (whole lockup).
        "& > span": { transition: "color 160ms ease" },
        "&:hover > span": { color: "primary.main" },
      }}
    >
      <Box component="span" sx={{ fontWeight: 800 }}>
        {primary}
      </Box>
      {kicker && (
        <Box
          component="span"
          sx={{
            fontWeight: 500,
            // Descriptor reads a touch smaller than the brand name.
            fontSize: "0.82em",
            color: onDark ? "grey.400" : "text.secondary",
          }}
        >
          {kicker}
        </Box>
      )}
    </Typography>
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
