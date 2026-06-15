import type { RouteStats } from "@/lib/geo/route-service";
import { fetchNearbyGasStation, fetchNearbyHotel, pointAlongRouteByMiles } from "@/lib/geo/route-pois";
import { fetchLiveRegularGasPrice } from "@/lib/budget/gas-prices";
import type { MoveProfile } from "@/lib/move-profile";
import type { RouteStop } from "@/lib/types";

function generateFallbackStops(stats: RouteStats, profile: MoveProfile): RouteStop[] {
  const stops: RouteStop[] = [];
  const miles = stats.distanceMiles;
  const days = Math.max(1, Math.ceil(stats.durationHours / 8));

  const gasInterval = Math.max(250, Math.floor(miles / Math.max(2, Math.floor(miles / 350))));
  for (let mile = gasInterval; mile < miles; mile += gasInterval) {
    stops.push({
      id: `gas-${mile}`,
      type: "gas",
      name: "Fuel & rest stop",
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

/** Resolve real gas stations and hotels along the OSRM route geometry. */
export async function fetchRouteStops(
  stats: RouteStats,
  profile: MoveProfile
): Promise<RouteStop[]> {
  const coords = stats.geometry?.coordinates;
  if (!coords?.length || coords.length < 2) {
    return generateFallbackStops(stats, profile);
  }

  const miles = stats.distanceMiles;
  const days = Math.max(1, Math.ceil(stats.durationHours / 8));
  const stops: RouteStop[] = [];
  const usedIds = new Set<string>();
  const liveGas = await fetchLiveRegularGasPrice();

  const gasInterval = Math.max(250, Math.floor(miles / Math.max(2, Math.floor(miles / 350))));
  const gasMileMarkers: number[] = [];
  for (let mile = gasInterval; mile < miles; mile += gasInterval) {
    gasMileMarkers.push(mile);
    if (gasMileMarkers.length >= 4) break;
  }

  const gasResults = await Promise.all(
    gasMileMarkers.map(async (mile) => {
      const point = pointAlongRouteByMiles(coords, mile);
      if (!point) return null;
      const poi = await fetchNearbyGasStation(point.lat, point.lon, usedIds, liveGas);
      return poi ? { mile, poi } : null;
    })
  );

  for (const result of gasResults) {
    if (!result) continue;
    stops.push({
      id: `gas-${result.poi.osmId}`,
      type: "gas",
      name: result.poi.name,
      location: result.poi.location,
      lat: result.poi.lat,
      lon: result.poi.lon,
      gasPricePerGallon: result.poi.gasPricePerGallon,
      notes: `~${result.mile} mi from ${profile.origin.split(",")[0]?.trim() || "origin"} · $${result.poi.gasPricePerGallon.toFixed(2)}/gal · 20–30 min break`,
    });
  }

  if (days > 1) {
    const hotelResults = await Promise.all(
      Array.from({ length: days - 1 }, (_, i) => i + 1).map(async (day) => {
        const mile = (miles / days) * day;
        const point = pointAlongRouteByMiles(coords, mile);
        if (!point) return null;
        const poi = await fetchNearbyHotel(point.lat, point.lon, usedIds, profile.pets);
        return poi ? { day, mile, poi } : null;
      })
    );

    for (const result of hotelResults) {
      if (!result) continue;
      const isPet = profile.pets && result.poi.petFriendly;
      stops.push({
        id: `hotel-${result.poi.osmId}`,
        type: isPet ? "pet_hotel" : profile.pets ? "pet_hotel" : "hotel",
        name: result.poi.name,
        location: result.poi.location,
        lat: result.poi.lat,
        lon: result.poi.lon,
        estimatedPrice: result.poi.estimatedPrice,
        notes:
          profile.pets && !result.poi.petFriendly
            ? `Night ${result.day} · ~$${result.poi.estimatedPrice}/night · Verify pet policy`
            : `Night ${result.day} · ~$${result.poi.estimatedPrice}/night · ~${Math.round(result.mile)} mi`,
      });
    }
  }

  if (stops.length === 0) {
    const mid = pointAlongRouteByMiles(coords, miles / 2);
    if (mid) {
      const gas = await fetchNearbyGasStation(mid.lat, mid.lon, usedIds, liveGas);
      if (gas) {
        stops.push({
          id: `rest-${gas.osmId}`,
          type: "rest",
          name: gas.name,
          location: gas.location,
          lat: gas.lat,
          lon: gas.lon,
          gasPricePerGallon: gas.gasPricePerGallon,
          notes: "Mid-route break",
        });
      }
    }
  }

  if (stops.length === 0) {
    return generateFallbackStops(stats, profile);
  }

  return stops.slice(0, 8);
}

/** @deprecated Use fetchRouteStops for real POI data. Kept for sync callers. */
export function generateRouteStops(stats: RouteStats, profile: MoveProfile): RouteStop[] {
  return generateFallbackStops(stats, profile);
}
