import * as React from "react";
import Image from "next/image";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import DirectionsCarFilledRoundedIcon from "@mui/icons-material/DirectionsCarFilledRounded";

interface LogoProps {
  companyName: string;
  logoUrl?: string | null;
  variant?: "default" | "onDark";
  /**
   * What to render:
   * - "name": navbar mark. Shows the uploaded logo image when one is set,
   *   otherwise falls back to the text wordmark.
   * - "logo": the uploaded logo image, larger (used in the footer). Falls back
   *   to the wordmark when no logo image is set.
   */
  display?: "name" | "logo";
  /** Size multiplier for the "logo" display (from branding.logoScale). */
  scale?: number;
  /** Base height in px for the "logo" image before scaling. */
  baseHeight?: number;
  /**
   * Base height in px for the navbar logo image (display="name") before
   * scaling. Responsive object allowed.
   */
  navHeight?: number | Record<string, number>;
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
  navHeight = { xs: 34, md: 40 },
}: LogoProps) {
  const onDark = variant === "onDark";
  const clampedScale = Math.min(Math.max(scale, 0.8), 3);

  if (display === "logo" && logoUrl) {
    const height = Math.round(baseHeight * clampedScale);
    // next/image serves an optimized variant instead of the raw Supabase file.
    // The intrinsic width/height are only hints for aspect ratio; the actual
    // size is fixed by `style` (height fixed, width auto) so the layout and
    // proportions stay EXACTLY as before. `unoptimized` fallback is not needed
    // because the branding bucket is covered by remotePatterns.
    return (
      <Image
        src={logoUrl}
        alt={companyName}
        height={height}
        width={Math.round(height * 4)}
        sizes="260px"
        style={{ height, width: "auto", maxWidth: "100%", objectFit: "contain", display: "block" }}
      />
    );
  }

  // Navbar: show the uploaded logo image when there is one, scaled by the
  // navbar logo scale; otherwise fall back to the text wordmark below.
  if (display === "name" && logoUrl) {
    const scaledNavHeight =
      typeof navHeight === "number"
        ? Math.round(navHeight * clampedScale)
        : Object.fromEntries(
            Object.entries(navHeight).map(([bp, h]) => [bp, Math.round(h * clampedScale)])
          );
    // Largest possible rendered height, used only as the intrinsic size hint
    // for next/image (the on-screen size is driven by the responsive `sx`
    // height below, exactly as before). Using `Box component={Image}` lets us
    // keep MUI's responsive `sx` while routing the request through the Next
    // image optimizer (AVIF/WebP + resize) instead of the raw Supabase file.
    const maxNavHeight =
      typeof scaledNavHeight === "number"
        ? scaledNavHeight
        : Math.max(...Object.values(scaledNavHeight));
    return (
      <Box
        component={Image}
        src={logoUrl}
        alt={companyName}
        height={maxNavHeight}
        width={Math.round(maxNavHeight * 5)}
        sizes="260px"
        sx={{
          height: scaledNavHeight,
          width: "auto",
          maxWidth: { xs: 180, md: 260 },
          objectFit: "contain",
          display: "block",
        }}
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
