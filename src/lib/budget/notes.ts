import type { Locale } from "@/lib/i18n";
import { translate } from "@/lib/i18n";
import {
  localizedHousehold,
  localizedRentalPreference,
} from "@/lib/budget/localize-labels";
import type { RentalPreferenceKey } from "@/lib/move-profile";
import type { RouteStop } from "@/lib/types";
import { hotelEstimatesFromStops } from "@/lib/budget/hotel-cost";

export function buildBudgetNotes(
  locale: Locale,
  params: {
    distanceMiles: number;
    household: string;
    rentalKey: RentalPreferenceKey;
    rentalPreference: string;
    fuelNote: string;
    routeStops?: RouteStop[];
    truckChoice?: string | null;
  }
): string[] {
  const t = (key: string, p?: Record<string, string | number>) =>
    translate(locale, key, p);

  const notes: string[] = [
    t("budgetNotes.distanceHousehold", {
      miles: params.distanceMiles.toLocaleString(locale === "es" ? "es-US" : "en-US"),
      household: localizedHousehold(params.household, locale),
    }),
  ];

  if (params.rentalKey === "own") {
    notes.push(t("budgetNotes.ownVehicle"));
  } else {
    notes.push(
      t("budgetNotes.rentalPreference", {
        preference: localizedRentalPreference(params.rentalPreference, locale),
      })
    );
  }

  if (params.truckChoice) {
    notes.push(t("budgetNotes.truckChoiceApplied", { choice: params.truckChoice }));
  }

  notes.push(params.fuelNote);
  notes.push(t("budgetNotes.regionalPricing"));

  const hotelNights = hotelEstimatesFromStops(params.routeStops ?? []);
  if (hotelNights.length > 0) {
    notes.push(
      t("budgetNotes.hotelsDetail", {
        detail: hotelNights
          .map((h) =>
            t("budgetNotes.hotelNight", {
              night: h.night,
              name: h.name,
              price: h.pricePerNight,
            })
          )
          .join("; "),
      })
    );
  }

  return notes;
}
