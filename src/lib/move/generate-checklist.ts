import type { Locale } from "@/lib/i18n";
import type { MoveProfile } from "@/lib/move-profile";
import type { ChecklistTask } from "@/lib/types";
import {
  generateChecklistFromProfileI18n,
  generateStarterDocumentsI18n,
} from "@/lib/checklist/generate-checklist-i18n";

export function generateChecklistFromProfile(
  profile: MoveProfile,
  locale: Locale = "en"
): Omit<ChecklistTask, "id">[] {
  return generateChecklistFromProfileI18n(profile, locale);
}

export function generateStarterDocuments(profile: MoveProfile, locale: Locale = "en") {
  return generateStarterDocumentsI18n(profile, locale);
}
