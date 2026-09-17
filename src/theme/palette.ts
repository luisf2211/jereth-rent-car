import type { PaletteOptions } from "@mui/material/styles";

/**
 * Central brand palette.
 *
 * All brand colors live here so components never hardcode hex values.
 * In a later phase these values can be sourced from `CompanySettings`
 * (see lib/branding) to make the palette configurable per Rent Car company.
 *
 * Identity: black / white / magenta-pink, with predominantly light surfaces
 * for a premium, legible feel.
 */

export const brandColors = {
  magenta: "#E6007A",
  magentaDark: "#B80063",
  magentaLight: "#FF4DA6",
  black: "#0A0A0A",
  white: "#FFFFFF",
  offWhite: "#FAFAFA",
  border: "#ECECEC",
  textPrimary: "#141414",
  textSecondary: "#5C5C5C",
} as const;

/**
 * Build a MUI palette from a brand primary color.
 * Accepting the primary color as an argument keeps the door open for
 * dynamic branding without changing the theme structure.
 */
export function createBrandPalette(primaryColor: string = brandColors.magenta): PaletteOptions {
  return {
    mode: "light",
    primary: {
      main: primaryColor,
      dark: brandColors.magentaDark,
      light: brandColors.magentaLight,
      contrastText: brandColors.white,
    },
    secondary: {
      main: brandColors.black,
      contrastText: brandColors.white,
    },
    background: {
      default: brandColors.white,
      paper: brandColors.white,
    },
    text: {
      primary: brandColors.textPrimary,
      secondary: brandColors.textSecondary,
    },
    divider: brandColors.border,
  };
}
