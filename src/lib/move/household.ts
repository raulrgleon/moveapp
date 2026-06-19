import type { MoveProfile } from "@/lib/move-profile";

export interface HouseholdCounts {
  adults: number;
  children: number;
  petCount: number;
}

export function parseHouseholdCounts(profile: MoveProfile): HouseholdCounts {
  let adults = 0;
  let children = 0;
  let petCount = 0;

  const adultMatch = profile.household.match(/(\d+)\s*adult/i);
  const childMatch = profile.household.match(/(\d+)\s*child/i);
  if (adultMatch) adults = Math.max(0, parseInt(adultMatch[1], 10));
  if (childMatch) children = Math.max(0, parseInt(childMatch[1], 10));

  const petMatch =
    profile.petDetails.match(/(\d+)\s*pet/i) ||
    profile.household.match(/(\d+)\s*pet/i);
  if (petMatch) petCount = Math.max(0, parseInt(petMatch[1], 10));
  else if (profile.pets) petCount = 1;

  return { adults, children, petCount };
}

/** Parse "2 adults, 1 child" style strings from onboarding/settings. */
export function parseHouseholdString(household: string): HouseholdCounts {
  let adults = 0;
  let children = 0;
  const adultMatch = household.match(/(\d+)\s*adult/i);
  const childMatch = household.match(/(\d+)\s*child/i);
  if (adultMatch) adults = Math.max(0, parseInt(adultMatch[1], 10));
  if (childMatch) children = Math.max(0, parseInt(childMatch[1], 10));
  if (adults === 0 && children === 0 && household.trim()) adults = 1;
  return { adults, children, petCount: 0 };
}

/**
 * Bedroom count suited to the moving household (sleeping space, not luxury sizing).
 * 1 person → 1 bed · 2–3 → 2 bed · 4–5 → 3 bed · 6+ → 4 bed
 */
export function recommendBedrooms(counts: HouseholdCounts): number {
  const people = Math.max(1, counts.adults + counts.children);
  if (people <= 1) return 1;
  if (people <= 3) return 2;
  if (people <= 5) return 3;
  return 4;
}

export function recommendBedroomsFromHousehold(household: string): number {
  return recommendBedrooms(parseHouseholdString(household));
}
