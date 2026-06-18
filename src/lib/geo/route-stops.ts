import type { RouteStats } from "@/lib/geo/route-service";
import { fetchNearbyGasStation, fetchNearbyHotel, pointAlongRouteByMiles } from "@/lib/geo/route-pois";
import {
  computeFuelStopMarkers,
  formatFuelStopNote,
} from "@/lib/geo/fuel-stop-planner";
import { fetchLiveRegularGasPrice } from "@/lib/budget/gas-prices";
import type { MoveProfile } from "@/lib/move-profile";
import type { RouteStop } from "@/lib/types";
import type { VehicleInfo } from "@/lib/vehicles/types";

export interface RouteStopsContext {
  vehicles?: VehicleInfo[];
  rentalPreference?: string;
  vehicleCount?: number;
  locale?: "en" | "es";
}

function originShortLabel(profile: MoveProfile): string {
  return profile.origin.split(",")[0]?.trim() || "origin";
}

function fuelMarkersForRoute(
  stats: RouteStats,
  profile: MoveProfile,
  context?: RouteStopsContext
) {
  return computeFuelStopMarkers({
    distanceMiles: stats.distanceMiles,
    rentalPreference: context?.rentalPreference ?? profile.rentalPreference,
    vehicles: context?.vehicles,
    vehicleCount: context?.vehicleCount,
  });
}

function generateFallbackStops(
  stats: RouteStats,
  profile: MoveProfile,
  coordinates?: [number, number][],
  context?: RouteStopsContext
): RouteStop[] {
  const stops: RouteStop[] = [];
  const miles = stats.distanceMiles;
  const days = Math.max(1, Math.ceil(stats.durationHours / 8));
  const originLabel = originShortLabel(profile);
  const locale = context?.locale ?? "en";
  const fuelMarkers = fuelMarkersForRoute(stats, profile, context);

  for (const marker of fuelMarkers) {
    const mile = marker.mile;
    const point = coordinates?.length ? pointAlongRouteByMiles(coordinates, mile) : null;
    stops.push({
      id: `gas-${mile}`,
      type: "gas",
      name: marker.isElectric
        ? locale === "es"
          ? "Parada de recarga"
          : "EV charging stop"
        : locale === "es"
          ? "Gasolinera"
          : "Fuel stop",
      location: `~${mile} mi from ${originLabel}`,
      lat: point?.lat,
      lon: point?.lon,
      isElectric: marker.isElectric,
      notes: formatFuelStopNote(marker, mile, originLabel, locale),
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

  if (stops.length === 0 && miles >= 80) {
    const marker = fuelMarkersForRoute(stats, profile, context)[0];
    const mile = marker?.mile ?? miles / 2;
    const point = coordinates?.length ? pointAlongRouteByMiles(coordinates, mile) : null;
    stops.push({
      id: "rest-mid",
      type: "rest",
      name: "Mid-route rest stop",
      location: `~${Math.round(mile)} mi`,
      lat: point?.lat,
      lon: point?.lon,
      notes: marker
        ? formatFuelStopNote(marker, Math.round(mile), originLabel, locale)
        : "Short break halfway through your drive.",
      isElectric: marker?.isElectric,
    });
  }

  return stops.slice(0, 10);
}

/** Resolve gas/charging and hotels along the OSRM route geometry. */
export async function fetchRouteStops(
  stats: RouteStats,
  profile: MoveProfile,
  context?: RouteStopsContext
): Promise<RouteStop[]> {
  const coords = stats.geometry?.coordinates;
  if (!coords?.length || coords.length < 2) {
    return generateFallbackStops(stats, profile, undefined, context);
  }

  const miles = stats.distanceMiles;
  const days = Math.max(1, Math.ceil(stats.durationHours / 8));
  const stops: RouteStop[] = [];
  const usedIds = new Set<string>();
  const liveGas = await fetchLiveRegularGasPrice();
  const originLabel = originShortLabel(profile);
  const locale = context?.locale ?? "en";
  const fuelMarkers = fuelMarkersForRoute(stats, profile, context);

  const gasResults = await Promise.all(
    fuelMarkers.map(async (marker) => {
      const point = pointAlongRouteByMiles(coords, marker.mile);
      if (!point) return null;
      const poi = marker.isElectric
        ? null
        : await fetchNearbyGasStation(point.lat, point.lon, usedIds, liveGas);
      return { marker, point, poi };
    })
  );

  for (const result of gasResults) {
    if (!result) continue;
    const { marker, point, poi } = result;
    const mile = marker.mile;
    const note = formatFuelStopNote(marker, mile, originLabel, locale);

    if (poi) {
      stops.push({
        id: `gas-${poi.osmId}`,
        type: "gas",
        name: poi.name,
        location: poi.location,
        lat: poi.lat,
        lon: poi.lon,
        gasPricePerGallon: poi.gasPricePerGallon,
        isElectric: false,
        notes: `${note} · $${poi.gasPricePerGallon.toFixed(2)}/gal`,
      });
    } else {
      stops.push({
        id: `gas-route-${mile}`,
        type: "gas",
        name: marker.isElectric
          ? locale === "es"
            ? "Parada de recarga"
            : "EV charging stop"
          : locale === "es"
            ? "Gasolinera recomendada"
            : "Recommended fuel stop",
        location: `~${mile} mi from ${originLabel}`,
        lat: point.lat,
        lon: point.lon,
        gasPricePerGallon: marker.isElectric ? undefined : liveGas,
        isElectric: marker.isElectric,
        notes: note,
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
    return generateFallbackStops(stats, profile, coords, context);
  }

  return stops.slice(0, 10);
}

/** @deprecated Use fetchRouteStops for real POI data. Kept for sync callers. */
export function generateRouteStops(
  stats: RouteStats,
  profile: MoveProfile,
  context?: RouteStopsContext
): RouteStop[] {
  return generateFallbackStops(stats, profile, stats.geometry?.coordinates, context);
}
