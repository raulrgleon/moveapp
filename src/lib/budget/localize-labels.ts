import type { Locale } from "@/lib/i18n";
import { translate } from "@/lib/i18n";
import { parseRentalPreferenceKey } from "@/lib/move-profile";

function countPhrase(
  locale: Locale,
  count: number,
  oneKey: string,
  manyKey: string
): string {
  return translate(locale, count === 1 ? oneKey : manyKey, { count });
}

function joinHouseholdParts(parts: string[], locale: Locale): string {
  if (parts.length <= 1) return parts[0] ?? "";
  const conj = locale === "es" ? " y " : " and ";
  if (parts.length === 2) return parts.join(conj);
  return `${parts.slice(0, -1).join(", ")}${conj}${parts[parts.length - 1]}`;
}

/** Localize stored household string (always saved in English) for budget notes. */
export function localizedHousehold(household: string, locale: Locale): string {
  const trimmed = household.trim();
  if (!trimmed) return translate(locale, "budgetNotes.yourHousehold");

  const adultsMatch = trimmed.match(/(\d+)\s+(?:adults?|adultos?)/i);
  const childrenMatch = trimmed.match(/(\d+)\s+(?:children?|child|niños?|nino|ninos)/i);
  const petsMatch = trimmed.match(/(\d+)\s+(?:pets?|mascotas?)/i);

  const parts: string[] = [];

  if (adultsMatch) {
    parts.push(
      countPhrase(
        locale,
        Number(adultsMatch[1]),
        "budgetNotes.adultsOne",
        "budgetNotes.adultsMany"
      )
    );
  }
  if (childrenMatch) {
    parts.push(
      countPhrase(
        locale,
        Number(childrenMatch[1]),
        "budgetNotes.childrenOne",
        "budgetNotes.childrenMany"
      )
    );
  }
  if (petsMatch) {
    parts.push(
      countPhrase(
        locale,
        Number(petsMatch[1]),
        "budgetNotes.petsOne",
        "budgetNotes.petsMany"
      )
    );
  }

  if (parts.length > 0) {
    return joinHouseholdParts(parts, locale);
  }

  // Custom pet details or legacy free-text household — return as-is.
  return trimmed;
}

/** Localize rental preference label from stored English string or key. */
export function localizedRentalPreference(preference: string, locale: Locale): string {
  const key = parseRentalPreferenceKey(preference);
  return translate(locale, `budgetNotes.rentalOptions.${key}`);
}
