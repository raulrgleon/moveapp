import { en } from "./messages/en";
import { es } from "./messages/es";

export type Locale = "en" | "es";

export const DEFAULT_LOCALE: Locale = "en";
export const LOCALE_STORAGE_KEY = "movepilot_locale";

export const SUPPORTED_LOCALES: { code: Locale; labelKey: string }[] = [
  { code: "en", labelKey: "settings.english" },
  { code: "es", labelKey: "settings.spanish" },
];

const catalogs: Record<Locale, Record<string, unknown>> = { en, es };

/** Detect locale from browser / device language. */
export function detectDeviceLocale(): Locale {
  if (typeof window === "undefined") return DEFAULT_LOCALE;

  const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
  if (stored === "en" || stored === "es") return stored;

  const languages: string[] = [];
  if (navigator.language) languages.push(navigator.language);
  if (navigator.languages) languages.push(...navigator.languages);

  for (const lang of languages) {
    const lower = lang.toLowerCase();
    if (lower.startsWith("es")) return "es";
    if (lower.startsWith("en")) return "en";
  }

  return DEFAULT_LOCALE;
}

function getNested(obj: Record<string, unknown>, path: string): string | undefined {
  const parts = path.split(".");
  let current: unknown = obj;
  for (const part of parts) {
    if (current == null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[part];
  }
  return typeof current === "string" ? current : undefined;
}

export function translate(
  locale: Locale,
  key: string,
  params?: Record<string, string | number>
): string {
  let text = getNested(catalogs[locale] as Record<string, unknown>, key);
  if (!text) {
    text = getNested(catalogs.en as Record<string, unknown>, key);
  }
  if (!text) return key;

  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    }
  }
  return text;
}

export function getLocaleLabel(locale: Locale, labelLocale: Locale): string {
  return translate(labelLocale, locale === "en" ? "settings.english" : "settings.spanish");
}
