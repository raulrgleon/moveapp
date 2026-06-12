import type { MoveProfile } from "@/lib/move-profile";

export interface HouseholdCounts {
  adults: number;
  children: number;
  petCount: number;
}

export function parseHouseholdCounts(profile: MoveProfile): HouseholdCounts {
  let adults = 1;
  let children = 0;
  let petCount = 0;

  const adultMatch = profile.household.match(/(\d+)\s*adult/i);
  const childMatch = profile.household.match(/(\d+)\s*child/i);
  if (adultMatch) adults = Math.max(1, parseInt(adultMatch[1], 10));
  if (childMatch) children = parseInt(childMatch[1], 10);

  const petMatch =
    profile.petDetails.match(/(\d+)\s*pet/i) ||
    profile.household.match(/(\d+)\s*pet/i);
  if (petMatch) petCount = parseInt(petMatch[1], 10);
  else if (profile.pets) petCount = 1;

  return { adults, children, petCount };
}
