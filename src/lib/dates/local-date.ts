/** Parse YYYY-MM-DD (or ISO datetime) as local calendar date (avoids UTC shift). */
export function parseLocalDate(iso: string): Date {
  const datePart = iso.slice(0, 10);
  const [y, m, d] = datePart.split("-").map(Number);
  return startOfDay(new Date(y, (m ?? 1) - 1, d ?? 1));
}

export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function addDaysLocal(d: Date, days: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return startOfDay(x);
}

/** Calendar days from `from` to `to` (to − from). */
export function daysBetweenLocal(from: Date, to: Date): number {
  return Math.round((startOfDay(to).getTime() - startOfDay(from).getTime()) / 86400000);
}

export function formatLocalISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function formatShortDateRange(
  start: Date,
  end: Date,
  locale: "en" | "es"
): string {
  const intl = locale === "es" ? "es-US" : "en-US";
  const sameYear = start.getFullYear() === end.getFullYear();
  const sameMonth = sameYear && start.getMonth() === end.getMonth();

  if (start.getTime() === end.getTime()) {
    return new Intl.DateTimeFormat(intl, {
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(start);
  }

  if (sameMonth) {
    const month = new Intl.DateTimeFormat(intl, { month: "short" }).format(start);
    return `${month} ${start.getDate()}–${end.getDate()}, ${start.getFullYear()}`;
  }

  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  const startStr = new Intl.DateTimeFormat(intl, opts).format(start);
  const endStr = new Intl.DateTimeFormat(intl, {
    ...opts,
    year: sameYear ? undefined : "numeric",
  }).format(end);
  return sameYear
    ? `${startStr} – ${endStr}, ${start.getFullYear()}`
    : `${startStr}, ${start.getFullYear()} – ${endStr}, ${end.getFullYear()}`;
}
