import type { Locale } from "@/lib/i18n";
import { translate } from "@/lib/i18n";
import type { MoveProfile } from "@/lib/move-profile";
import type { TruckOption } from "@/lib/types";
import type { VehicleInfo } from "@/lib/vehicles/types";
import { anyVehicleCanTow } from "@/lib/vehicles/tow-capacity";
import { estimateFuelCostSync } from "@/lib/budget/fuel-cost";

function t(locale: Locale, key: string, params?: Record<string, string | number>) {
  return translate(locale, key, params);
}

function localizeOption(locale: Locale, option: TruckOption, miles: number, mult: number): TruckOption {
  const id = option.id;
  const mileageFree = Math.max(200, Math.round(miles * 0.15));
  const mileageBudget = Math.max(150, Math.round(miles * 0.12));

  const mileagePolicy =
    id === "uhaul-trailer"
      ? t(locale, "trucksPage.mileageUnlimited")
      : id === "penske-truck"
        ? t(locale, "trucksPage.mileageAfter", { rate: "0.99", miles: mileageFree })
        : id === "budget-truck"
          ? t(locale, "trucksPage.mileageAfter", { rate: "0.79", miles: mileageBudget })
          : t(locale, "trucksPage.mileageAfter", { rate: "0.69", miles: mileageFree });

  const prosKeys: Record<string, string[]> = {
    "uhaul-trailer": [
      "trucksPage.proUhaulTrailer1",
      "trucksPage.proUhaulTrailer2",
      "trucksPage.proUhaulTrailer3",
    ],
    "penske-truck": [
      "trucksPage.proPenske1",
      "trucksPage.proPenske2",
      "trucksPage.proPenske3",
    ],
    "budget-truck": [
      "trucksPage.proBudget1",
      "trucksPage.proBudget2",
      "trucksPage.proBudget3",
    ],
    "uhaul-truck": [
      "trucksPage.proUhaulTruck1",
      "trucksPage.proUhaulTruck2",
      "trucksPage.proUhaulTruck3",
    ],
  };

  const consKeys: Record<string, string[]> = {
    "uhaul-trailer": [
      "trucksPage.conUhaulTrailer1",
      "trucksPage.conUhaulTrailer2",
    ],
    "penske-truck": ["trucksPage.conPenske1", "trucksPage.conPenske2"],
    "budget-truck": ["trucksPage.conBudget1", "trucksPage.conBudget2"],
    "uhaul-truck": ["trucksPage.conUhaulTruck1", "trucksPage.conUhaulTruck2"],
  };

  const bestForKeys: Record<string, string> = {
    "uhaul-trailer": "trucksPage.bestForTrailer",
    "penske-truck": "trucksPage.bestForPenske",
    "budget-truck": "trucksPage.bestForBudget",
    "uhaul-truck": "trucksPage.bestForUhaulTruck",
  };

  return {
    ...option,
    mileagePolicy,
    pros: (prosKeys[id] ?? []).map((k) => t(locale, k)),
    cons: (consKeys[id] ?? []).map((k) => t(locale, k)),
    bestFor: t(locale, bestForKeys[id] ?? "trucksPage.bestForDefault"),
  };
}

export function estimateTruckOptions(
  profile: MoveProfile,
  distanceMiles: number,
  locale: Locale = "en",
  vehicles: VehicleInfo[] = []
): TruckOption[] {
  const miles = Math.max(50, distanceMiles);
  const mult = /4|5|6|large|grande/i.test(profile.household) ? 1.2 : 1;

  const trailerPrice = Math.round(89 + miles * 0.32 * mult);
  const truckSmall = Math.round(199 + miles * 0.78 * mult);
  const truckLarge = Math.round(279 + miles * 0.92 * mult);
  const budgetTruck = Math.round(175 + miles * 0.72 * mult);

  const raw: TruckOption[] = [
    {
      id: "uhaul-trailer",
      company: "U-Haul",
      estimatedPrice: trailerPrice,
      vehicleSize: "6×12 Open Trailer",
      mileagePolicy: "",
      pros: [],
      cons: [],
      bestFor: "",
      type: "trailer",
    },
    {
      id: "penske-truck",
      company: "Penske",
      estimatedPrice: truckSmall,
      vehicleSize: "12 ft Truck",
      mileagePolicy: "",
      pros: [],
      cons: [],
      bestFor: "",
      type: "truck",
    },
    {
      id: "budget-truck",
      company: "Budget",
      estimatedPrice: budgetTruck,
      vehicleSize: "16 ft Truck",
      mileagePolicy: "",
      pros: [],
      cons: [],
      bestFor: "",
      type: "truck",
    },
    {
      id: "uhaul-truck",
      company: "U-Haul",
      estimatedPrice: truckLarge,
      vehicleSize: "15 ft Truck",
      mileagePolicy: "",
      pros: [],
      cons: [],
      bestFor: "",
      type: "truck",
    },
  ];

  const localized = raw.map((o) => localizeOption(locale, o, miles, mult));

  if (vehicles.length > 0 && !anyVehicleCanTow(vehicles)) {
    return localized.filter((o) => o.type === "truck");
  }

  return localized;
}

export function buildTrailerRecommendation(
  profile: MoveProfile,
  distanceMiles: number,
  vehicles: VehicleInfo[],
  locale: Locale = "en"
): string {
  const miles = Math.max(50, distanceMiles);
  const origin = profile.origin.split(",")[0]?.trim() || "origin";
  const dest = profile.destination.split(",")[0]?.trim() || "destination";
  const trailer = Math.round(89 + miles * 0.32);
  const truck = Math.round(199 + miles * 0.78);
  const savings = Math.max(0, truck - trailer);
  const vehicle = vehicles[0]?.displayLabel;

  if (/mover|profesional/i.test(profile.rentalPreference)) {
    return t(locale, "trucksPage.recMovers", {
      miles: miles.toLocaleString(locale === "es" ? "es-US" : "en-US"),
      origin,
      dest,
      household: profile.household,
    });
  }

  if (vehicles.length > 0 && !anyVehicleCanTow(vehicles)) {
    return t(locale, "trucksPage.recNoTow", {
      miles: miles.toLocaleString(locale === "es" ? "es-US" : "en-US"),
      origin,
      dest,
      truck: truck.toLocaleString(locale === "es" ? "es-US" : "en-US"),
    });
  }

  if (vehicle) {
    return t(locale, "trucksPage.recWithVehicle", {
      miles: miles.toLocaleString(locale === "es" ? "es-US" : "en-US"),
      origin,
      dest,
      vehicle,
      trailer: trailer.toLocaleString(locale === "es" ? "es-US" : "en-US"),
      savings: savings.toLocaleString(locale === "es" ? "es-US" : "en-US"),
    });
  }

  return t(locale, "trucksPage.recGeneric", {
    miles: miles.toLocaleString(locale === "es" ? "es-US" : "en-US"),
    origin,
    dest,
    trailer: trailer.toLocaleString(locale === "es" ? "es-US" : "en-US"),
    truck: truck.toLocaleString(locale === "es" ? "es-US" : "en-US"),
  });
}

export function estimateFuelCost(distanceMiles: number, vehicleCount: number): number {
  return estimateFuelCostSync({
    distanceMiles,
    rentalKey: "own",
    vehicleCount,
    origin: "",
    destination: "",
  }).total;
}
