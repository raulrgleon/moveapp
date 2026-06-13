import type { Locale } from "@/lib/i18n";
import { translate } from "@/lib/i18n";
import type { DestinationUtilityProvider } from "@/lib/types";

export function utilityCategoryLabel(category: string, locale: Locale): string {
  const key = `utilityCategories.${category}`;
  const label = translate(locale, key);
  return label === key ? category : label;
}

export function localizeUtilityProvider(
  provider: DestinationUtilityProvider,
  locale: Locale
): DestinationUtilityProvider {
  const cat = provider.category;
  const localizedCategory = utilityCategoryLabel(cat, locale);

  const pros =
    locale === "es"
      ? [
          translate(locale, "utilitiesPage.providerPros.required"),
          translate(locale, "utilitiesPage.providerPros.setup"),
        ]
      : provider.pros;

  const cons =
    locale === "es"
      ? [translate(locale, "utilitiesPage.providerCons.verify")]
      : provider.cons;

  return {
    ...provider,
    categoryLabel: localizedCategory,
    priceUnit: provider.priceUnit?.includes("est")
      ? translate(locale, "utilitiesPage.priceEstMo")
      : provider.priceUnit,
    coverageNote: provider.coverageNote
      ? localizeCoverageNote(provider.coverageNote, locale)
      : provider.coverageNote,
    pros: cat === "electricity" || cat === "water" || cat === "gas" ? pros : provider.pros?.map((p) => localizeProCon(p, locale)),
    cons: provider.cons?.map((c) => localizeProCon(c, locale)),
  };
}

function localizeProCon(text: string, locale: Locale): string {
  if (locale === "en") return text;
  const map: Record<string, string> = {
    "Required utility": translate(locale, "utilitiesPage.providerPros.required"),
    "Start service before move-in": translate(locale, "utilitiesPage.providerPros.setup"),
    "Rates vary by usage and season": translate(locale, "utilitiesPage.providerCons.rates"),
    "Usually single local provider": translate(locale, "utilitiesPage.providerPros.local"),
    "Online transfer available": translate(locale, "utilitiesPage.providerPros.online"),
    "Limited provider choice": translate(locale, "utilitiesPage.providerCons.limited"),
    "Schedule setup ahead of move": translate(locale, "utilitiesPage.providerPros.schedule"),
    "Not all buildings have gas": translate(locale, "utilitiesPage.providerCons.noGas"),
    "Reported at this location": translate(locale, "utilitiesPage.providerPros.reported"),
    "Compare plans before signing": translate(locale, "utilitiesPage.providerPros.compare"),
    "Prices are estimates — confirm with provider": translate(locale, "utilitiesPage.providerCons.prices"),
  };
  return map[text] ?? text;
}

function localizeCoverageNote(note: string, locale: Locale): string {
  if (locale === "en") return note;
  if (note.includes("FCC broadband")) {
    return translate(locale, "utilitiesPage.coverageFcc");
  }
  if (note.includes("Typical provider")) {
    return translate(locale, "utilitiesPage.coverageTypical");
  }
  if (note.includes("City/county water")) {
    return translate(locale, "utilitiesPage.coverageWater");
  }
  if (note.includes("Gas service")) {
    return translate(locale, "utilitiesPage.coverageGas");
  }
  return note;
}

export function localizeUtilitiesSummary(summary: string, locale: Locale): string {
  if (locale === "en") return summary;
  if (summary.includes("Fiber available")) {
    return translate(locale, "utilitiesPage.summaryFiber");
  }
  if (summary.includes("Utilities for")) {
    return translate(locale, "utilitiesPage.summaryGeneric");
  }
  return summary;
}

export function localizeUtilityProviders(
  providers: DestinationUtilityProvider[],
  locale: Locale
): DestinationUtilityProvider[] {
  return providers.map((p) => localizeUtilityProvider(p, locale));
}
