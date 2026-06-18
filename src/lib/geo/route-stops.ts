import type { RouteStats } from "@/lib/geo/route-service";
import { fetchNearbyGasStation, fetchNearbyHotel, pointAlongRouteByMiles } from "@/lib/geo/route-pois";
import { fetchLiveRegularGasPrice } from "@/lib/budget/gas-prices";
import type { MoveProfile } from "@/lib/move-profile";
import type { RouteStop } from "@/lib/types";

function originShortLabel(profile: MoveProfile): string {
  return profile.origin.split(",")[0]?.trim() || "origin";
}

function gasMileMarkers(miles: number): number[] {
  const gasInterval = Math.max(250, Math.floor(miles / Math.max(2, Math.floor(miles / 350))));
  const markers: number[] = [];
  for (let mile = gasInterval; mile < miles; mile += gasInterval) {
    markers.push(mile);
    if (markers.length >= 4) break;
  }
  return markers;
}

function generateFallbackStops(
  stats: RouteStats,
  profile: MoveProfile,
  coordinates?: [number, number][]
): RouteStop[] {
  const stops: RouteStop[] = [];
  const miles = stats.distanceMiles;
  const days = Math.max(1, Math.ceil(stats.durationHours / 8));
  const originLabel = originShortLabel(profile);

  for (const mile of gasMileMarkers(miles)) {
    const point = coordinates?.length ? pointAlongRouteByMiles(coordinates, mile) : null;
    stops.push({
      id: `gas-${mile}`,
      type: "gas",
      name: "Fuel & rest stop",
      location: point
        ? `~${mile} mi from ${originLabel}`
        : `~${mile} mi from ${originLabel}`,
      lat: point?.lat,
      lon: point?.lon,
      notes: "Plan a 20–30 min break for fuel and stretch.",
    });
  }

  if (days > 1) {
    for (let day = 1; day < days; day++) {
      const mile = (miles / days) * day;
      const point = coordinates?.length ? pointAlongRouteByMiles(coordinates, mile) : null;
      stops.push({
        id: `hotel-${day}`,
        type: profile.pets ? "pet_hotel" : "hotel",
        name: profile.pets ? "Pet-friendly overnight stop" : "Overnight hotel stop",
        location: `Night ${day} — ~${Math.round(mile)} mi`,
        lat: point?.lat,
        lon: point?.lon,
        notes: profile.pets
          ? "Book a pet-friendly hotel along your route."
          : "Recommended break for a multi-day drive.",
      });
    }
  }

  if (stops.length === 0) {
    const mile = miles / 2;
    const point = coordinates?.length ? pointAlongRouteByMiles(coordinates, mile) : null;
    stops.push({
      id: "rest-mid",
      type: "rest",
      name: "Mid-route rest stop",
      location: `~${Math.round(mile)} mi`,
      lat: point?.lat,
      lon: point?.lon,
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
  const originLabel = originShortLabel(profile);

  const gasResults = await Promise.all(
    gasMileMarkers(miles).map(async (mile) => {
      const point = pointAlongRouteByMiles(coords, mile);
      if (!point) return null;
      const poi = await fetchNearbyGasStation(point.lat, point.lon, usedIds, liveGas);
      return { mile, point, poi };
    })
  );

  for (const result of gasResults) {
    if (!result) continue;
    const { mile, point, poi } = result;
    if (poi) {
      stops.push({
        id: `gas-${poi.osmId}`,
        type: "gas",
        name: poi.name,
        location: poi.location,
        lat: poi.lat,
        lon: poi.lon,
        gasPricePerGallon: poi.gasPricePerGallon,
        notes: `~${mile} mi from ${originLabel} · $${poi.gasPricePerGallon.toFixed(2)}/gal · 20–30 min break`,
      });
    } else {
      stops.push({
        id: `gas-route-${mile}`,
        type: "gas",
        name: "Fuel & rest stop",
        location: `~${mile} mi from ${originLabel}`,
        lat: point.lat,
        lon: point.lon,
        gasPricePerGallon: liveGas,
        notes: `~${mile} mi from ${originLabel} · Plan a fuel stop along your route`,
      });
    }
  }

  if (days > 1) {
    const hotelResults = await Promise.all(
      Array.from({ length: days - 1 }, (_, i) => i + 1).map(async (day) => {
        const mile = (miles / days) * day;
        const point = pointAlongRouteByMiles(coords, mile);
        if (!point) return null;
        const poi = await fetchNearbyHotel(point.lat, point.lon, usedIds, profile.pets);
        return { day, mile, point, poi };
      })
    );

    for (const result of hotelResults) {
      if (!result) continue;
      const { day, mile, point, poi } = result;
      if (poi) {
        const isPet = profile.pets && poi.petFriendly;
        stops.push({
          id: `hotel-${poi.osmId}`,
          type: isPet ? "pet_hotel" : profile.pets ? "pet_hotel" : "hotel",
          name: poi.name,
          location: poi.location,
          lat: poi.lat,
          lon: poi.lon,
          estimatedPrice: poi.estimatedPrice,
          notes:
            profile.pets && !poi.petFriendly
              ? `Night ${day} · ~$${poi.estimatedPrice}/night · Verify pet policy`
              : `Night ${day} · ~$${poi.estimatedPrice}/night · ~${Math.round(mile)} mi`,
        });
      } else {
        stops.push({
          id: `hotel-route-${day}`,
          type: profile.pets ? "pet_hotel" : "hotel",
          name: profile.pets ? "Pet-friendly overnight stop" : "Overnight hotel stop",
          location: `Night ${day} — ~${Math.round(mile)} mi`,
          lat: point.lat,
          lon: point.lon,
          notes: profile.pets
            ? "Book a pet-friendly hotel near this point on your route."
            : `Night ${day} · Recommended stop ~${Math.round(mile)} mi`,
        });
      }
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
      } else {
        stops.push({
          id: "rest-mid",
          type: "rest",
          name: "Mid-route rest stop",
          location: `~${Math.round(miles / 2)} mi`,
          lat: mid.lat,
          lon: mid.lon,
          notes: "Short break halfway through your drive.",
        });
      }
    }
  }

  if (stops.length === 0) {
    return generateFallbackStops(stats, profile, coords);
  }

  return stops.slice(0, 8);
}

/** @deprecated Use fetchRouteStops for real POI data. Kept for sync callers. */
export function generateRouteStops(stats: RouteStats, profile: MoveProfile): RouteStop[] {
  return generateFallbackStops(stats, profile, stats.geometry?.coordinates);
}
