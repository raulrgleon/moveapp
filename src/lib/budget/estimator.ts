import type { MoveProfile } from "@/lib/move-profile";
import { parseRentalPreferenceKey } from "@/lib/move-profile";
import { estimateFuelCost } from "@/lib/budget/fuel-cost";
import { hotelEstimatesFromStops, totalHotelCost } from "@/lib/budget/hotel-cost";
import type { RouteStop } from "@/lib/types";

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

function householdMultiplier(household: string): number {
  if (/4|5|6|large|grande/i.test(household)) return 1.35;
  if (/3|three|tres/i.test(household)) return 1.2;
  if (/2|two|dos|couple/i.test(household)) return 1.0;
  return 0.85;
}

function rentalLineItem(
  rentalKey: ReturnType<typeof parseRentalPreferenceKey>,
  miles: number,
  mult: number
): BudgetEstimateLine | null {
  switch (rentalKey) {
    case "movers":
      return {
        category: "Professional movers",
        estimated: Math.round(1800 * mult + miles * 0.45),
        sortOrder: 1,
      };
    case "truck":
      return {
        category: "Truck rental",
        estimated: Math.round(199 + miles * 0.78 * mult),
        cheapestOption: "Compare Penske vs U-Haul on Trucks page",
        sortOrder: 1,
      };
    case "trailer":
      return {
        category: "Trailer rental",
        estimated: Math.round(89 + miles * 0.32 * mult),
        cheapestOption: "6×12 open trailer + your SUV",
        sortOrder: 1,
      };
    case "combo":
      return {
        category: "Trailer rental",
        estimated: Math.round(110 + miles * 0.38 * mult),
        cheapestOption: "Trailer towed by your vehicle",
        sortOrder: 1,
      };
    case "own":
    default:
      return null;
  }
}

function fallbackHotelNights(miles: number, durationHours?: number): number {
  if (durationHours != null && durationHours > 10) {
    return Math.max(0, Math.ceil(durationHours / 10) - 1);
  }
  return Math.max(0, Math.ceil(miles / 500) - 1);
}

export function estimateBudget(
  profile: MoveProfile,
  context: BudgetEstimateContext = {}
): BudgetEstimate {
  const miles = context.distanceMiles ?? estimateDistanceMiles(profile.origin, profile.destination);
  const mult = householdMultiplier(profile.household);
  const rentalKey = parseRentalPreferenceKey(profile.rentalPreference);
  const vehicleCount = context.vehicleCount ?? 1;

  const items: BudgetEstimateLine[] = [];
  let sortOrder = 1;

  const rental = rentalLineItem(rentalKey, miles, mult);
  if (rental) {
    items.push({ ...rental, sortOrder: sortOrder++ });
  }

  const fuel = estimateFuelCost({
    distanceMiles: miles,
    rentalKey,
    vehicleCount,
    origin: profile.origin,
    destination: profile.destination,
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
      const perNight = 129;
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

  const vehicleTransport = profile.needsVehicleTransport
    ? Math.round(900 + miles * 0.15)
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
  const notes = [
    `Estimate based on ~${miles.toLocaleString()} mi and ${profile.household || "your household"}.`,
    rentalKey === "own"
      ? "No rental cost — using your own vehicle."
      : `Rental preference: ${profile.rentalPreference}.`,
    fuel.note,
  ];

  if (hotelNights.length > 0) {
    notes.push(
      `Hotels: ${hotelNights.map((h) => `Night ${h.night} — ${h.name} (~$${h.pricePerNight})`).join("; ")}`
    );
  }

  notes.push("Fuel uses regional gas prices along your route. Hotel rates reflect property type and state averages.");

  return { items, totalEstimated, distanceMiles: miles, notes };
}
