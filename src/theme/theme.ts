import { createTheme } from "@mui/material/styles";
import { createBrandPalette, brandColors } from "./palette";
import LinkBehavior from "./LinkBehavior";

/**
 * Centralized MUI theme.
 *
 * Visual philosophy: modern, editorial, premium rent-car. Generous spacing,
 * confident typography, very subtle shadows, black/white dominant with magenta
 * as a deliberate accent (never filler). `buildTheme` accepts an optional
 * primary color so branding can drive it from configuration later.
 */
export function buildTheme(primaryColor?: string) {
  return createTheme({
    palette: createBrandPalette(primaryColor),
    shape: {
      borderRadius: 14,
    },
    typography: {
      fontFamily: "var(--font-geist-sans), system-ui, -apple-system, Arial, sans-serif",
      h1: { fontWeight: 800, letterSpacing: "-0.035em", lineHeight: 1.05 },
      h2: { fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.1 },
      h3: { fontWeight: 700, letterSpacing: "-0.025em", lineHeight: 1.15 },
      h4: { fontWeight: 700, letterSpacing: "-0.02em" },
      h5: { fontWeight: 700, letterSpacing: "-0.01em" },
      h6: { fontWeight: 700 },
      subtitle1: { color: brandColors.textSecondary, lineHeight: 1.6 },
      button: { fontWeight: 600, textTransform: "none" },
    },
    components: {
      MuiButtonBase: {
        defaultProps: {
          LinkComponent: LinkBehavior,
        },
      },
      MuiLink: {
        defaultProps: {
          component: LinkBehavior,
        },
      },
      MuiButton: {
        defaultProps: { disableElevation: true },
        styleOverrides: {
          root: {
            // Modern, sober rounded rectangle — not a pill.
            borderRadius: 8,
            paddingInline: 20,
            minHeight: 44,
            transition: "background-color 140ms ease, border-color 140ms ease, opacity 140ms ease",
          },
          sizeLarge: {
            minHeight: 52,
            paddingInline: 26,
            fontSize: "1rem",
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: { minWidth: 44, minHeight: 44 },
        },
      },
      MuiCard: {
        defaultProps: { elevation: 0 },
        styleOverrides: {
          root: {
            border: `1px solid ${brandColors.border}`,
            borderRadius: 18,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          rounded: { borderRadius: 18 },
        },
      },
      MuiTextField: {
        defaultProps: { fullWidth: true },
      },
      MuiChip: {
        styleOverrides: {
          root: { fontWeight: 600 },
        },
      },
      MuiAppBar: {
        defaultProps: { elevation: 0, color: "inherit" },
      },
      MuiContainer: {
        defaultProps: { maxWidth: "lg" },
      },
    },
  });
}

export const theme = buildTheme();
