"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import ButtonBase from "@mui/material/ButtonBase";

import { LOCALES, type Locale } from "@/i18n/config";
import { useI18n } from "@/i18n/LanguageProvider";

const LABELS: Record<Locale, string> = {
  es: "ES",
  en: "EN",
};

/**
 * Compact ES / EN segmented toggle. Two variants:
 * - "onDark" (default): sits in the black header, white text.
 * - "onLight": for the mobile drawer (white surface).
 *
 * Selecting a language persists the choice (cookie) and re-renders via
 * router.refresh() WITHOUT navigation, so an in-progress reservation keeps its
 * dates, selected vehicle and typed data.
 */
export default function LanguageSwitcher({
  variant = "onDark",
}: {
  variant?: "onDark" | "onLight";
}) {
  const { locale, setLocale, t } = useI18n();
  const onDark = variant === "onDark";

  const border = onDark ? "rgba(255,255,255,0.28)" : "rgba(0,0,0,0.18)";
  const idleColor = onDark ? "rgba(255,255,255,0.72)" : "rgba(0,0,0,0.6)";
  const activeBg = onDark ? "common.white" : "#0A0A0A";
  const activeColor = onDark ? "#0A0A0A" : "common.white";
  const hoverBg = onDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.06)";

  return (
    <Box
      role="group"
      aria-label={t("nav.language")}
      sx={{
        display: "inline-flex",
        alignItems: "center",
        border: `1px solid ${border}`,
        borderRadius: 999,
        p: "2px",
        gap: "2px",
      }}
    >
      {LOCALES.map((code) => {
        const active = code === locale;
        return (
          <ButtonBase
            key={code}
            onClick={() => setLocale(code)}
            aria-pressed={active}
            aria-label={LABELS[code]}
            sx={{
              px: 1.25,
              py: 0.25,
              minWidth: 34,
              borderRadius: 999,
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: 0.4,
              lineHeight: 1.6,
              color: active ? activeColor : idleColor,
              bgcolor: active ? activeBg : "transparent",
              transition: "background-color .15s, color .15s",
              "&:hover": { bgcolor: active ? activeBg : hoverBg },
            }}
          >
            {LABELS[code]}
          </ButtonBase>
        );
      })}
    </Box>
  );
}
