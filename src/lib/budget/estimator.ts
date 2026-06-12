import type { MoveProfile } from "@/lib/move-profile";

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

export function estimateBudget(profile: MoveProfile, distanceMiles?: number): BudgetEstimate {
  const miles = distanceMiles ?? estimateDistanceMiles(profile.origin, profile.destination);
  const mult = householdMultiplier(profile.household);
  const isTrailer = /trailer|remolque/i.test(profile.rentalPreference);
  const isTruck = /truck|camión|u-haul/i.test(profile.rentalPreference);
  const isMovers = /mover|profesional/i.test(profile.rentalPreference);

  const truckOrTrailer = isMovers
    ? Math.round(1800 * mult + miles * 0.45)
    : isTruck
      ? Math.round(650 + miles * 0.85)
      : Math.round(420 + miles * 0.55);

  const fuel = Math.round(miles * 0.14 * (isTrailer ? 1.2 : 1));
  const packing = Math.round(120 * mult);
  const utilities = 75;
  const travel = Math.round(Math.max(1, Math.ceil(miles / 500)) * 140);
  const insurance = 145;
  const deposits = profile.needsHousingHelp ? 1200 : 0;
  const vehicleTransport = profile.needsVehicleTransport ? Math.round(900 + miles * 0.15) : 0;
  const misc = Math.round(150 * mult);

  const items: BudgetEstimateLine[] = [
    {
      category: isMovers ? "Professional movers" : isTruck ? "Truck rental" : "Trailer rental",
      estimated: truckOrTrailer,
      cheapestOption: isTrailer ? "Own SUV + 6×12 trailer" : undefined,
      sortOrder: 1,
    },
    { category: "Fuel", estimated: fuel, sortOrder: 2 },
    { category: "Packing supplies", estimated: packing, sortOrder: 3 },
    { category: "Travel & lodging", estimated: travel, sortOrder: 4 },
    { category: "Utility setup fees", estimated: utilities, sortOrder: 5 },
    { category: "Insurance updates", estimated: insurance, sortOrder: 6 },
  ];

  if (deposits > 0) {
    items.push({
      category: "Housing deposit",
      estimated: deposits,
      sortOrder: 7,
    });
  }
  if (vehicleTransport > 0) {
    items.push({
      category: "Vehicle transport",
      estimated: vehicleTransport,
      sortOrder: 8,
    });
  }
  items.push({ category: "Miscellaneous", estimated: misc, sortOrder: 9 });

  const totalEstimated = items.reduce((s, i) => s + i.estimated, 0);
  const notes = [
    `Estimate based on ~${miles.toLocaleString()} mi and ${profile.household}.`,
    "Actual costs vary by season and provider.",
  ];

  return { items, totalEstimated, distanceMiles: miles, notes };
}
