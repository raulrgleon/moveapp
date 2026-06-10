/**
 * i18n-ready structure for English / Spanish.
 * Visible copy is English for MVP; swap locale via future next-intl or similar.
 */

export type Locale = "en" | "es";

export const DEFAULT_LOCALE: Locale = "en";

export const SUPPORTED_LOCALES: { code: Locale; label: string }[] = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
];

// Placeholder for future translation keys
export const messages = {
  en: {
    appName: "MovePilot AI",
    tagline: "Your AI co-pilot for moving anywhere.",
  },
  es: {
    appName: "MovePilot AI",
    tagline: "Tu copiloto de IA para mudarte a cualquier lugar.",
  },
} as const;

export function getMessage(locale: Locale, key: keyof typeof messages.en): string {
  return messages[locale][key] ?? messages.en[key];
}
