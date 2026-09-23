/**
 * Formatting helpers for the confirmation PDF. Matches the approved mockup:
 * "US$975.00", "22 de septiembre de 2026", "10:24 a. m.".
 */

const MESES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

export function pdfMoney(n: number): string {
  return `US$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** "2026-10-20" -> "20 de octubre de 2026". Empty-safe. */
export function pdfLongDate(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  return `${d} de ${MESES[m - 1]} de ${y}`;
}

/** "13:30" -> "1:30 p. m." (Spanish am/pm). Empty-safe. */
export function pdfTime12(hhmm: string): string {
  if (!hhmm) return "";
  const [hStr, mStr] = hhmm.split(":");
  let h = Number(hStr);
  const m = mStr ?? "00";
  if (Number.isNaN(h)) return hhmm;
  const suffix = h >= 12 ? "p. m." : "a. m.";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m.padStart(2, "0")} ${suffix}`;
}

/** ISO datetime -> "22 de septiembre de 2026" + "10:24 a. m." parts. */
export function pdfDateTimeParts(iso: string): { date: string; time: string } {
  if (!iso) return { date: "", time: "" };
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { date: "", time: "" };
  const date = `${d.getDate()} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
  const time = pdfTime12(`${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`);
  return { date, time };
}

/** Combine a "YYYY-MM-DD" date and "HH:mm" into "20 de octubre de 2026 · 1:30 p. m." */
export function pdfDateTimeLabel(dateIso: string, time: string): string {
  const dd = pdfLongDate(dateIso);
  const tt = pdfTime12(time);
  return [dd, tt].filter(Boolean).join(" · ");
}

/** Mask an id/passport keeping only the last 4 chars: "••••4582". */
export function maskId(value: string): string {
  if (!value) return "";
  const last = value.slice(-4);
  return `••••${last}`;
}
