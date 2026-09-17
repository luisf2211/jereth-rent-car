import { createTheme } from "@mui/material/styles";
import { createBrandPalette, brandColors } from "./palette";
import LinkBehavior from "./LinkBehavior";

/**
 * Centralized MUI theme.
 *
 * Visual philosophy: clean, airy, Airbnb-inspired. Soft rounded corners,
 * very subtle shadows, generous spacing, no gradients or heavy effects.
 *
 * `buildTheme` takes an optional primary color so branding can eventually
 * drive the theme from configuration without restructuring anything.
 */
export function buildTheme(primaryColor?: string) {
  return createTheme({
    palette: createBrandPalette(primaryColor),
    shape: {
      borderRadius: 12,
    },
    typography: {
      fontFamily: "var(--font-geist-sans), system-ui, -apple-system, Arial, sans-serif",
      h1: { fontWeight: 700, letterSpacing: "-0.02em" },
      h2: { fontWeight: 700, letterSpacing: "-0.02em" },
      h3: { fontWeight: 700, letterSpacing: "-0.01em" },
      h4: { fontWeight: 600, letterSpacing: "-0.01em" },
      h5: { fontWeight: 600 },
      h6: { fontWeight: 600 },
      button: { fontWeight: 600, textTransform: "none" },
      subtitle1: { color: brandColors.textSecondary },
    },
    components: {
      MuiButtonBase: {
        defaultProps: {
          // Use Next.js Link for client-side navigation on any button/link base.
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
            borderRadius: 999,
            paddingInline: 20,
            minHeight: 44, // comfortable touch target
          },
          sizeLarge: {
            minHeight: 52,
            paddingInline: 28,
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
            borderRadius: 16,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          rounded: { borderRadius: 16 },
        },
      },
      MuiTextField: {
        defaultProps: { fullWidth: true },
      },
      MuiAppBar: {
        defaultProps: { elevation: 0, color: "inherit" },
        styleOverrides: {
          root: {
            backgroundColor: brandColors.white,
            borderBottom: `1px solid ${brandColors.border}`,
          },
        },
      },
      MuiContainer: {
        defaultProps: { maxWidth: "lg" },
      },
    },
  });
}

export const theme = buildTheme();
