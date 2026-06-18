import type { MoveProfile } from "@/lib/move-profile";
import { parseRentalPreferenceKey } from "@/lib/move-profile";
import { estimateFuelCost } from "@/lib/budget/fuel-cost";
import { buildBudgetNotes } from "@/lib/budget/notes";
import {
  computeRentalByPreferenceKey,
  computeVehicleShipCost,
  householdMultiplier,
  isShipTransportChoice,
} from "@/lib/budget/pricing";
import { hotelEstimatesFromStops, regionalHotelNightlyRate, totalHotelCost } from "@/lib/budget/hotel-cost";
import { rentalPreferenceForTruckChoice, resolveTruckChoiceOption } from "@/lib/trucks/truck-choice";
import type { Locale } from "@/lib/i18n";
import type { RouteStop } from "@/lib/types";
import type { VehicleInfo } from "@/lib/vehicles/types";
import { truckOptionLabel } from "@/lib/trucks/truck-choice";

export interface BudgetEstimateLine {
  category: string;
  estimated: number;
  cheapestOption?: string;
  sortOrder: number;
}

export interface BudgetEstimate {
  items: BudgetEstimateLine[];
  totalEstimated: number;
  distanceMiles: number;
  notes: string[];
}

export interface BudgetEstimateContext {
  distanceMiles?: number;
  durationHours?: number;
  routeStops?: RouteStop[];
  vehicleCount?: number;
  truckChoice?: string | null;
  vehicleTransportChoice?: string | null;
  locale?: Locale;
  vehicles?: VehicleInfo[];
}

function estimateDistanceMiles(origin: string, destination: string): number {
  const pairs: Record<string, number> = {
    "austin,huntington": 1087,
    "austin,dallas": 195,
    "miami,orlando": 235,
    "los angeles,san francisco": 380,
    "new york,boston": 215,
  };
  const key = `${origin.split(",")[0].trim().toLowerCase()},${destination.split(",")[0].trim().toLowerCase()}`;
  if (pairs[key]) return pairs[key];
  return 800;
}

function householdMultiplierLocal(household: string): number {
  return householdMultiplier(household);
}

function rentalLineItem(
  rentalKey: ReturnType<typeof parseRentalPreferenceKey>,
  miles: number,
  mult: number,
  truckChoice?: string | null,
  profile?: MoveProfile,
  vehicles: VehicleInfo[] = [],
  locale: Locale = "en"
): BudgetEstimateLine | null {
  const saved =
    profile && truckChoice
      ? resolveTruckChoiceOption(profile, truckChoice, miles, locale, vehicles)
      : null;

  if (saved) {
    return {
      category: saved.type === "trailer" ? "Trailer rental" : "Truck rental",
      estimated: saved.estimatedPrice,
      cheapestOption: truckOptionLabel(saved),
      sortOrder: 1,
    };
  }

  const fallback = computeRentalByPreferenceKey(rentalKey, miles, profile?.household ?? "");
  if (!fallback) return null;
  return {
    category: fallback.category,
    estimated: fallback.estimated,
    cheapestOption: fallback.cheapestOption,
    sortOrder: 1,
  };
}

function fallbackHotelNights(miles: number, durationHours?: number): number {
  if (durationHours != null && durationHours > 10) {
    return Math.max(0, Math.ceil(durationHours / 10) - 1);
  }
  return Math.max(0, Math.ceil(miles / 500) - 1);
}

export async function estimateBudget(
  profile: MoveProfile,
  context: BudgetEstimateContext = {}
): Promise<BudgetEstimate> {
  const locale = context.locale ?? "en";
  const miles = context.distanceMiles ?? estimateDistanceMiles(profile.origin, profile.destination);
  const mult = householdMultiplierLocal(profile.household);
  let rentalKey = parseRentalPreferenceKey(profile.rentalPreference);
  const vehicleCount = context.vehicleCount ?? 1;
  const vehicles = context.vehicles ?? [];

  if (context.truckChoice) {
    rentalKey = parseRentalPreferenceKey(rentalPreferenceForTruckChoice(context.truckChoice));
  }

  const items: BudgetEstimateLine[] = [];
  let sortOrder = 1;

  const rental = rentalLineItem(
    rentalKey,
    miles,
    mult,
    context.truckChoice,
    profile,
    vehicles,
    locale
  );
  if (rental) {
    items.push({ ...rental, sortOrder: sortOrder++ });
  }

  const fuel = await estimateFuelCost({
    distanceMiles: miles,
    rentalKey,
    vehicleCount,
    origin: profile.origin,
    destination: profile.destination,
    routeStops: context.routeStops,
    vehicles,
    locale,
  });
  items.push({
    category: "Fuel",
    estimated: fuel.total,
    cheapestOption: fuel.note,
    sortOrder: sortOrder++,
  });

  const packing = Math.round(120 * mult);
  items.push({ category: "Packing supplies", estimated: packing, sortOrder: sortOrder++ });

  const routeStops = context.routeStops ?? [];
  const hotelTotal = totalHotelCost(routeStops);
  const hotelNights = hotelEstimatesFromStops(routeStops);

  if (hotelTotal > 0) {
    const hotelDetail = hotelNights
      .map((h) => `${h.name}: $${h.pricePerNight}/night`)
      .join(" · ");
    items.push({
      category: "Hotels",
      estimated: hotelTotal,
      cheapestOption: hotelDetail,
      sortOrder: sortOrder++,
    });
  } else {
    const nights = fallbackHotelNights(miles, context.durationHours);
    if (nights > 0) {
      const perNight = regionalHotelNightlyRate(profile.origin, profile.destination, profile.pets);
      items.push({
        category: "Hotels",
        estimated: nights * perNight,
        cheapestOption: `${nights} night${nights > 1 ? "s" : ""} @ ~$${perNight}/night (regional avg)`,
        sortOrder: sortOrder++,
      });
    }
  }

  const driveDays = Math.max(1, Math.ceil((context.durationHours ?? miles / 60) / 8));
  const meals = Math.round(driveDays * 45 * mult);
  items.push({
    category: "Meals on the road",
    estimated: meals,
    sortOrder: sortOrder++,
  });

  items.push({ category: "Utility setup fees", estimated: 75, sortOrder: sortOrder++ });
  items.push({ category: "Insurance updates", estimated: 145, sortOrder: sortOrder++ });

  const deposits = profile.needsHousingHelp ? 1200 : 0;
  if (deposits > 0) {
    items.push({ category: "Housing deposit", estimated: deposits, sortOrder: sortOrder++ });
  }

  const wantsShip =
    profile.needsVehicleTransport ||
    isShipTransportChoice(context.vehicleTransportChoice ?? null);
  const vehicleTransport = wantsShip
    ? computeVehicleShipCost(miles, Math.max(1, vehicles.length))
    : 0;
  if (vehicleTransport > 0) {
    items.push({
      category: "Vehicle transport",
      estimated: vehicleTransport,
      sortOrder: sortOrder++,
    });
  }

  items.push({ category: "Miscellaneous", estimated: Math.round(150 * mult), sortOrder: sortOrder++ });

  const totalEstimated = items.reduce((s, i) => s + i.estimated, 0);
  const notes = buildBudgetNotes(locale, {
    distanceMiles: miles,
    household: profile.household,
    rentalKey,
    rentalPreference: profile.rentalPreference,
    fuelNote: fuel.note,
    routeStops,
    truckChoice: context.truckChoice,
  });

  return { items, totalEstimated, distanceMiles: miles, notes };
}
