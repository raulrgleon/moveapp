import type { UserProfile } from "@/lib/types";

export const PROFILE_STORAGE_KEY = "movepilot_profile";

export interface MoveProfile {
  name: string;
  email: string;
  origin: string;
  destination: string;
  moveDate: string;
  household: string;
  pets: boolean;
  petDetails: string;
  budget: number;
  rentalPreference: string;
  needsHousingHelp: boolean;
  needsVehicleTransport: boolean;
  originLat?: number;
  originLon?: number;
  destinationLat?: number;
  destinationLon?: number;
}

export const DEFAULT_PROFILE: MoveProfile = {
  name: "",
  email: "",
  origin: "",
  destination: "",
  moveDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  household: "",
  pets: false,
  petDetails: "",
  budget: 5000,
  rentalPreference: "Use my own vehicle (no rental)",
  needsHousingHelp: false,
  needsVehicleTransport: false,
};

export const RENTAL_PREFERENCE_LABELS: Record<string, string> = {
  own: "Use my own vehicle (no rental)",
  truck: "Rent a moving truck",
  trailer: "Trailer rental with own SUV",
  movers: "Hire professional movers",
  combo: "Trailer + own vehicle combo",
};

export type RentalPreferenceKey = keyof typeof RENTAL_PREFERENCE_LABELS;

/** Normalize stored label or key to a rental preference key. */
export function parseRentalPreferenceKey(preference: string): RentalPreferenceKey {
  const p = preference.trim().toLowerCase();
  if (!p || p === "own" || /own vehicle|sin renta|no rental|mi propio/i.test(p)) return "own";
  if (/mover|profesional|hire/i.test(p)) return "movers";
  if (/combo|remolque.*suv|trailer.*vehicle/i.test(p)) return "combo";
  if (/truck|camión|u-haul|rent a truck|rentar camión/i.test(p)) return "truck";
  if (/trailer|remolque/i.test(p)) return "trailer";
  return "own";
}

export function rentalPreferenceFromKey(key: string): string {
  return RENTAL_PREFERENCE_LABELS[key] ?? key;
}

export function profileToUserProfile(profile: MoveProfile, extras?: { destinationAddress?: string; vehicles?: string[] }): UserProfile {
  return {
    name: profile.name,
    email: profile.email,
    origin: profile.origin,
    destination: profile.destination,
    destinationAddress: extras?.destinationAddress ?? "",
    moveDate: profile.moveDate,
    household: householdWithPets(profile),
    pets: profile.pets,
    vehicles: extras?.vehicles ?? [],
    rentalPreference: profile.rentalPreference,
    budget: profile.budget,
    needsHousingHelp: profile.needsHousingHelp,
    needsVehicleTransport: profile.needsVehicleTransport,
  };
}

export function householdWithPets(profile: MoveProfile): string {
  if (!profile.pets || !profile.petDetails.trim()) return profile.household;
  return `${profile.household}, ${profile.petDetails.trim()}`;
}

export function formatHousehold(adults: number, children: number): string {
  if (adults <= 0 && children <= 0) return "";
  const parts: string[] = [];
  if (adults > 0) {
    parts.push(`${adults} adult${adults === 1 ? "" : "s"}`);
  }
  if (children > 0) {
    parts.push(`${children} child${children === 1 ? "" : "ren"}`);
  }
  return parts.join(", ");
}

export function formatPetDetails(petCount: number): string {
  if (petCount <= 0) return "";
  return `${petCount} pet${petCount === 1 ? "" : "s"}`;
}

export function householdWithPetsFromCounts(
  adults: number,
  children: number,
  petCount: number
): string {
  const base = formatHousehold(adults, children);
  const pets = formatPetDetails(petCount);
  return pets ? `${base}, ${pets}` : base;
}

export function loadProfileFromStorage(): MoveProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as MoveProfile;
    if (!parsed.name || !parsed.origin) return null;
    return { ...DEFAULT_PROFILE, ...parsed };
  } catch {
    return null;
  }
}

export function saveProfileToStorage(profile: MoveProfile) {
  if (typeof window === "undefined") return;
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
}

export async function geocodeQuery(
  query: string
): Promise<{ lat: number; lon: number } | null> {
  const q = query.trim();
  if (q.length < 3) return null;
  try {
    const res = await fetch(
      `/api/address/search?q=${encodeURIComponent(q)}&type=city`
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { lat: number; lon: number }[];
    const first = data[0];
    if (!first) return null;
    return { lat: first.lat, lon: first.lon };
  } catch {
    return null;
  }
}
