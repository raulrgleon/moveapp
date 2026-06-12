import type { RouteStats } from "@/lib/geo/route-service";
import type { MoveProfile } from "@/lib/move-profile";
import type { RouteStop } from "@/lib/types";

export function generateRouteStops(
  stats: RouteStats,
  profile: MoveProfile
): RouteStop[] {
  const stops: RouteStop[] = [];
  const miles = stats.distanceMiles;
  const days = Math.max(1, Math.ceil(stats.durationHours / 8));

  const gasInterval = Math.max(250, Math.floor(miles / Math.max(2, Math.floor(miles / 350))));
  for (let mile = gasInterval; mile < miles; mile += gasInterval) {
    stops.push({
      id: `gas-${mile}`,
      type: "gas",
      name: `Fuel & rest stop`,
      location: `~${mile} mi from ${profile.origin.split(",")[0]?.trim() || "origin"}`,
      notes: "Plan a 20–30 min break for fuel and stretch.",
    });
    if (stops.filter((s) => s.type === "gas").length >= 4) break;
  }

  if (days > 1) {
    for (let day = 1; day < days; day++) {
      stops.push({
        id: `hotel-${day}`,
        type: profile.pets ? "pet_hotel" : "hotel",
        name: profile.pets ? "Pet-friendly overnight stop" : "Overnight hotel stop",
        location: `Night ${day} — ~${Math.round((miles / days) * day)} mi`,
        notes: profile.pets
          ? "Book a pet-friendly hotel along your route."
          : "Recommended break for a multi-day drive.",
      });
    }
  }

  if (stops.length === 0) {
    stops.push({
      id: "rest-mid",
      type: "rest",
      name: "Mid-route rest stop",
      location: `~${Math.round(miles / 2)} mi`,
      notes: "Short break halfway through your drive.",
    });
  }

  return stops.slice(0, 8);
}
