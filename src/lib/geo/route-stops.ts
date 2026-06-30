import { formatDriveTime, type RouteStats } from "@/lib/geo/route-service";
import {
  distanceMilesBetween,
  fetchNearbyGasStation,
  fetchNearbyHotel,
  fetchRestBreakForRouteMile,
  pointAlongRouteByMiles,
  type RestBreakPoiKind,
} from "@/lib/geo/route-pois";
import {
  computeFuelStopMarkers,
  formatFuelStopNote,
} from "@/lib/geo/fuel-stop-planner";
import { computeRestBreakMarkers } from "@/lib/geo/rest-break-planner";
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

function fuelFieldsFromMarker(marker: ReturnType<typeof computeFuelStopMarkers>[number]) {
  return {
    vehicleFills: marker.vehicleFills,
    totalGallonsAtStop: marker.gallonsNeeded,
    isElectric: marker.isElectric,
  };
}

const MAX_ROUTE_STOPS = 30;

function sortStopsByMile(stops: RouteStop[]): RouteStop[] {
  return [...stops].sort((a, b) => (a.routeMile ?? 0) - (b.routeMile ?? 0));
}

function restBreakNote(
  hour: number,
  kind: RestBreakPoiKind,
  locale: "en" | "es"
): string {
  const label = formatDriveTime(hour);
  if (locale === "es") {
    const facility =
      kind === "gas_station"
        ? "Gasolinera con baños y tienda"
        : kind === "services"
          ? "Área de servicio en carretera"
          : "Área de descanso en carretera";
    return `Pausa a ~${label} de manejo · ${facility} · Estira las piernas y descansa.`;
  }
  const facility =
    kind === "gas_station"
      ? "Gas station with restrooms & convenience store"
      : kind === "services"
        ? "Highway service area"
        : "Highway rest area";
  return `Break at ~${label} of driving · ${facility} · Stretch and take a rest.`;
}

const NEAR_STOP_MILES = 0.45;

function findNearbyStop(
  stops: RouteStop[],
  lat: number,
  lon: number,
  types: RouteStop["type"][]
): RouteStop | null {
  for (const stop of stops) {
    if (stop.lat == null || stop.lon == null) continue;
    if (!types.includes(stop.type)) continue;
    if (distanceMilesBetween({ lat, lon }, { lat: stop.lat, lon: stop.lon }) <= NEAR_STOP_MILES) {
      return stop;
    }
  }
  return null;
}

function mergeRestBreakIntoStop(
  stop: RouteStop,
  hour: number,
  kind: RestBreakPoiKind,
  locale: "en" | "es"
): void {
  const note = restBreakNote(hour, kind, locale);
  stop.notes = stop.notes ? `${stop.notes} · ${note}` : note;
  stop.restStopKind = kind;
}

async function appendRestBreakStops(
  stops: RouteStop[],
  stats: RouteStats,
  coordinates: [number, number][] | undefined,
  usedRestOsmIds: Set<string>,
  locale: "en" | "es"
): Promise<void> {
  if (!coordinates?.length) return;

  const markers = computeRestBreakMarkers(stats.durationHours, stats.distanceMiles);

  for (const marker of markers) {
    const poi = await fetchRestBreakForRouteMile(
      coordinates,
      marker.mile,
      usedRestOsmIds,
      locale
    );
    if (!poi) continue;

    const nearby = findNearbyStop(stops, poi.lat, poi.lon, ["gas", "rest"]);
    if (nearby) {
      mergeRestBreakIntoStop(nearby, marker.hour, poi.kind, locale);
      continue;
    }

    stops.push({
      id: `rest-${poi.osmId}`,
      type: "rest",
      name: poi.name,
      location: poi.location,
      lat: poi.lat,
      lon: poi.lon,
      routeMile: marker.mile,
      restStopKind: poi.kind,
      notes: restBreakNote(marker.hour, poi.kind, locale),
    });
  }
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
      routeMile: mile,
      notes: formatFuelStopNote(marker, mile, originLabel, locale),
      ...fuelFieldsFromMarker(marker),
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
        routeMile: Math.round(mile),
        notes: profile.pets
          ? "Book a pet-friendly hotel along your route."
          : "Recommended break for a multi-day drive.",
      });
    }
  }

  return sortStopsByMile(stops).slice(0, MAX_ROUTE_STOPS);
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
        routeMile: mile,
        gasPricePerGallon: poi.gasPricePerGallon,
        notes: `${note} · $${poi.gasPricePerGallon.toFixed(2)}/gal`,
        ...fuelFieldsFromMarker(marker),
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
        routeMile: mile,
        gasPricePerGallon: marker.isElectric ? undefined : liveGas,
        notes: note,
        ...fuelFieldsFromMarker(marker),
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
          routeMile: Math.round(mile),
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
          routeMile: Math.round(mile),
          notes: profile.pets
            ? "Book a pet-friendly hotel near this point on your route."
            : `Night ${day} · Recommended stop ~${Math.round(mile)} mi`,
        });
      }
    }
  }

  await appendRestBreakStops(stops, stats, coords, new Set<string>(), locale);

  if (stops.length === 0) {
    return generateFallbackStops(stats, profile, coords, context);
  }

  return sortStopsByMile(stops).slice(0, MAX_ROUTE_STOPS);
}

/** @deprecated Use fetchRouteStops for real POI data. Kept for sync callers. */
export function generateRouteStops(
  stats: RouteStats,
  profile: MoveProfile,
  context?: RouteStopsContext
): RouteStop[] {
  return generateFallbackStops(stats, profile, stats.geometry?.coordinates, context);
}
