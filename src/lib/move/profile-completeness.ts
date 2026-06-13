import type { MoveProfile } from "@/lib/move-profile";

/** True when the user still needs to finish move setup (e.g. after Google OAuth). */
export function isMoveSetupIncomplete(profile: MoveProfile): boolean {
  return !profile.origin?.trim() || !profile.destination?.trim() || !profile.household?.trim();
}

export function hasRouteCoordinates(profile: MoveProfile): boolean {
  const hasOrigin = profile.originLat != null && profile.originLon != null;
  const hasDest = profile.destinationLat != null && profile.destinationLon != null;
  return hasOrigin && hasDest;
}
