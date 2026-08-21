export function fmtDuration(s: number | null | undefined): string | null {
  if (s == null) return null;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
    : `${m}:${String(sec).padStart(2, "0")}`;
}

export function fmtDate(iso: string | null | undefined): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** Calendar day in the user's home timezone, e.g. "2026-08-20". */
export function brusselsDay(date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Brussels" }).format(date);
}

/** Whole days from today (Brussels) until a YYYY-MM-DD date; negative = past. */
export function daysUntil(dateStr: string): number {
  const target = Date.parse(`${dateStr}T00:00:00Z`);
  const today = Date.parse(`${brusselsDay()}T00:00:00Z`);
  return Math.round((target - today) / 86_400_000);
}
