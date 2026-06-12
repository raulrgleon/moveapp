import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Locale } from "@/lib/i18n";
import { parseLocalDate } from "@/lib/dates/local-date";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, locale: Locale = "en"): string {
  const intlLocale = locale === "es" ? "es-US" : "en-US";
  return new Intl.NumberFormat(intlLocale, {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(
  date: string | Date,
  locale: Locale = "en"
): string {
  const intlLocale = locale === "es" ? "es-US" : "en-US";
  const d = typeof date === "string" ? parseLocalDate(date) : date;
  return new Intl.DateTimeFormat(intlLocale, {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

export function daysUntil(date: string | Date): number {
  const target = typeof date === "string" ? parseLocalDate(date) : date;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diff = target.getTime() - now.getTime();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}
