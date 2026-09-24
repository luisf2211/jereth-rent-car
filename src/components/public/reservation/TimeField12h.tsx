"use client";

import * as React from "react";
import Box from "@mui/material/Box";
import TextField from "@mui/material/TextField";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import FormHelperText from "@mui/material/FormHelperText";

import { useI18n } from "@/i18n/LanguageProvider";

/**
 * 12-hour time selector (hour / minute / AM–PM) that reads and writes a plain
 * 24-hour "HH:mm" string — exactly the same value shape as the previous
 * <input type="time">. This keeps the customer seeing AM/PM regardless of the
 * browser/OS locale, WITHOUT changing any downstream logic: rentalDays and the
 * server still receive "HH:mm" (24h).
 *
 * Minutes are offered in 5-minute steps (same granularity people pick for a
 * pickup/return). If an incoming value has an off-step minute (e.g. legacy
 * data), it is preserved by rounding to the nearest listed option on display
 * only when the user changes it; the stored value stays whatever was passed
 * until edited.
 */

const HOURS_12 = Array.from({ length: 12 }, (_, i) => i + 1); // 1..12
const MINUTES = Array.from({ length: 12 }, (_, i) => i * 5); // 0,5,...,55

type Meridiem = "AM" | "PM";

/** Parse "HH:mm" (24h) → { hour12, minute, meridiem }. Falls back to 10:00 AM. */
function parse24(value: string): { hour12: number; minute: number; meridiem: Meridiem } {
  const m = /^(\d{1,2}):(\d{2})$/.exec(value ?? "");
  let h = m ? Number(m[1]) : 10;
  let min = m ? Number(m[2]) : 0;
  if (Number.isNaN(h) || h < 0 || h > 23) h = 10;
  if (Number.isNaN(min) || min < 0 || min > 59) min = 0;
  const meridiem: Meridiem = h >= 12 ? "PM" : "AM";
  let hour12 = h % 12;
  if (hour12 === 0) hour12 = 12;
  return { hour12, minute: min, meridiem };
}

/** Build "HH:mm" (24h) from 12h parts. */
function to24(hour12: number, minute: number, meridiem: Meridiem): string {
  let h = hour12 % 12; // 12 → 0
  if (meridiem === "PM") h += 12;
  return `${String(h).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

/** Nearest listed minute option (5-min steps) for display of legacy values. */
function nearestMinute(min: number): number {
  return MINUTES.reduce((best, m) => (Math.abs(m - min) < Math.abs(best - min) ? m : best), 0);
}

export interface TimeField12hProps {
  label: string;
  value: string; // "HH:mm" (24h)
  onChange: (next: string) => void;
  error?: boolean;
  helperText?: string;
  /** Forwarded to the wrapper so validation focus/scroll keeps working. */
  fieldRef?: (el: HTMLElement | null) => void;
}

export default function TimeField12h({
  label,
  value,
  onChange,
  error,
  helperText,
  fieldRef,
}: TimeField12hProps) {
  const { t } = useI18n();
  const { hour12, minute, meridiem } = parse24(value);
  const displayMinute = MINUTES.includes(minute) ? minute : nearestMinute(minute);

  const emit = (h: number, m: number, mer: Meridiem) => onChange(to24(h, m, mer));

  return (
    <Box ref={fieldRef}>
      <Typography
        variant="caption"
        sx={{ display: "block", mb: 0.5, color: error ? "error.main" : "text.secondary" }}
      >
        {label}
      </Typography>
      <Box sx={{ display: "flex", gap: 1 }}>
        <TextField
          select
          size="small"
          value={hour12}
          onChange={(e) => emit(Number(e.target.value), displayMinute, meridiem)}
          error={error}
          aria-label={t("time.hourAria")}
          sx={{ flex: "1 1 0", minWidth: 64 }}
        >
          {HOURS_12.map((h) => (
            <MenuItem key={h} value={h}>
              {h}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          value={displayMinute}
          onChange={(e) => emit(hour12, Number(e.target.value), meridiem)}
          error={error}
          aria-label={t("time.minuteAria")}
          sx={{ flex: "1 1 0", minWidth: 64 }}
        >
          {MINUTES.map((m) => (
            <MenuItem key={m} value={m}>
              {String(m).padStart(2, "0")}
            </MenuItem>
          ))}
        </TextField>
        <TextField
          select
          size="small"
          value={meridiem}
          onChange={(e) => emit(hour12, displayMinute, e.target.value as Meridiem)}
          error={error}
          aria-label={t("time.meridiemAria")}
          sx={{ flex: "1 1 0", minWidth: 72 }}
        >
          <MenuItem value="AM">{t("time.am")}</MenuItem>
          <MenuItem value="PM">{t("time.pm")}</MenuItem>
        </TextField>
      </Box>
      {error && helperText ? <FormHelperText error>{helperText}</FormHelperText> : null}
    </Box>
  );
}
