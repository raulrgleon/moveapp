import { loadVehiclesWithMpg } from "@/lib/budget/route-context";
import { fetchOsrmRoutes } from "@/lib/geo/coordinates";
import { computeFuelStopMarkers } from "@/lib/geo/fuel-stop-planner";
import {
  estimateStopCount,
  formatDriveTime,
  resolveRoutePointsFromCityCenter,
  type RouteStats,
} from "@/lib/geo/route-service";
import { generateRouteStops } from "@/lib/geo/route-stops";
import { simplifyRouteCoordinates } from "@/lib/geo/simplify-coordinates";
import type { MoveProfile } from "@/lib/move-profile";
import { prisma } from "@/lib/prisma";
import type { RouteStop } from "@/lib/types";
import type { VehicleInfo } from "@/lib/vehicles/types";
import type { Prisma } from "@prisma/client";

export interface StoredRouteAlternative {
  index: number;
  distanceMiles: number;
  durationHours: number;
  driveTimeLabel: string;
  coordinates: [number, number][];
  usesInterstate: boolean;
  interstateRefs: string[];
}

export interface StoredMoveRoutesPayload {
  alternatives: StoredRouteAlternative[];
  stopsByIndex: Record<number, RouteStop[]>;
  selectedRouteIndex: number;
  computedAt: string;
  originLat: number;
  originLon: number;
  destinationLat: number;
  destinationLon: number;
  interstateMetadataReady: boolean;
}

function coordsMatch(
  a: { originLat: number; originLon: number; destinationLat: number; destinationLon: number },
  b: { originLat: number | null; originLon: number | null; destinationLat: number | null; destinationLon: number | null }
): boolean {
  if (b.originLat == null || b.originLon == null || b.destinationLat == null || b.destinationLon == null) {
    return false;
  }
  const eps = 0.0001;
  return (
    Math.abs(a.originLat - b.originLat) < eps &&
    Math.abs(a.originLon - b.originLon) < eps &&
    Math.abs(a.destinationLat - b.destinationLat) < eps &&
    Math.abs(a.destinationLon - b.destinationLon) < eps
  );
}

function parseStoredAlternatives(raw: unknown): StoredRouteAlternative[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (item): item is StoredRouteAlternative =>
        item != null &&
        typeof item === "object" &&
        typeof (item as StoredRouteAlternative).index === "number" &&
        Array.isArray((item as StoredRouteAlternative).coordinates)
    )
    .map((alt) => ({
      ...alt,
      usesInterstate: Boolean((alt as Partial<StoredRouteAlternative>).usesInterstate),
      interstateRefs: Array.isArray((alt as Partial<StoredRouteAlternative>).interstateRefs)
        ? (alt as Partial<StoredRouteAlternative>).interstateRefs!.filter(
            (ref): ref is string => typeof ref === "string"
          )
        : [],
    }));
}

function hasInterstateMetadata(raw: unknown): boolean {
  if (!Array.isArray(raw) || raw.length === 0) return false;
  return raw.every(
    (item) =>
      item != null &&
      typeof item === "object" &&
      Object.prototype.hasOwnProperty.call(item, "usesInterstate") &&
      Object.prototype.hasOwnProperty.call(item, "interstateRefs")
  );
}

function parseStoredStops(raw: unknown): Record<number, RouteStop[]> {
  if (!raw || typeof raw !== "object") return {};
  const out: Record<number, RouteStop[]> = {};
  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    const index = Number(key);
    if (!Number.isFinite(index) || !Array.isArray(value)) continue;
    out[index] = value as RouteStop[];
  }
  return out;
}

export function hasStoredStops(stopsByIndex: Record<number, RouteStop[]>): boolean {
  return Object.values(stopsByIndex).some((stops) => stops.length > 0);
}

function moveToProfile(
  user: { name: string; email: string },
  move: {
    origin: string;
    destination: string;
    moveDate: Date;
    household: string;
    pets: boolean;
    petDetails: string | null;
    budget: number;
    rentalPreference: string;
    needsHousingHelp: boolean;
    needsVehicleTransport: boolean;
    originLat: number | null;
    originLon: number | null;
    destinationLat: number | null;
    destinationLon: number | null;
  }
): MoveProfile {
  return {
    name: user.name,
    email: user.email,
    origin: move.origin,
    destination: move.destination,
    moveDate: move.moveDate.toISOString().slice(0, 10),
    household: move.household,
    pets: move.pets,
    petDetails: move.petDetails ?? "",
    budget: move.budget,
    rentalPreference: move.rentalPreference,
    needsHousingHelp: move.needsHousingHelp,
    needsVehicleTransport: move.needsVehicleTransport,
    originLat: move.originLat ?? undefined,
    originLon: move.originLon ?? undefined,
    destinationLat: move.destinationLat ?? undefined,
    destinationLon: move.destinationLon ?? undefined,
  };
}

function buildFastStopsForAlternatives(
  alternatives: StoredRouteAlternative[],
  profile: MoveProfile,
  rentalPreference: string,
  vehicles: VehicleInfo[],
  locale: "en" | "es" = "en"
): Record<number, RouteStop[]> {
  const stopsByIndex: Record<number, RouteStop[]> = {};
  const stopsContext = {
    vehicles,
    rentalPreference,
    vehicleCount: Math.max(1, vehicles.length),
    locale,
  };

  for (const alt of alternatives) {
    const fuelStopCount = computeFuelStopMarkers({
      distanceMiles: alt.distanceMiles,
      rentalPreference,
      vehicles,
      vehicleCount: Math.max(1, vehicles.length),
    }).length;
    const stopCount = estimateStopCount(
      alt.distanceMiles,
      alt.durationHours,
      profile.pets,
      fuelStopCount
    );
    const stats: RouteStats = {
      distanceMiles: alt.distanceMiles,
      durationHours: alt.durationHours,
      driveTimeLabel: alt.driveTimeLabel,
      stopCount,
      geometry: {
        coordinates: alt.coordinates,
        distanceMiles: alt.distanceMiles,
        durationHours: alt.durationHours,
      },
    };
    stopsByIndex[alt.index] = generateRouteStops(stats, profile, stopsContext);
  }

  return stopsByIndex;
}

export async function loadStoredMoveRoutes(moveId: string): Promise<StoredMoveRoutesPayload | null> {
  const move = await prisma.move.findUnique({
    where: { id: moveId },
    select: {
      originLat: true,
      originLon: true,
      destinationLat: true,
      destinationLon: true,
      selectedRouteIndex: true,
      routeAlternatives: true,
      routeStopsByIndex: true,
      routesComputedAt: true,
    },
  });

  if (
    !move ||
    move.originLat == null ||
    move.originLon == null ||
    move.destinationLat == null ||
    move.destinationLon == null ||
    !move.routeAlternatives ||
    !move.routesComputedAt
  ) {
    return null;
  }

  const alternatives = parseStoredAlternatives(move.routeAlternatives);
  if (!alternatives.length) return null;

  return {
    alternatives,
    stopsByIndex: parseStoredStops(move.routeStopsByIndex),
    selectedRouteIndex: move.selectedRouteIndex ?? 0,
    computedAt: move.routesComputedAt.toISOString(),
    originLat: move.originLat,
    originLon: move.originLon,
    destinationLat: move.destinationLat,
    destinationLon: move.destinationLon,
    interstateMetadataReady: hasInterstateMetadata(move.routeAlternatives),
  };
}

/** Ensure fallback stops exist for stored geometry (instant, no external APIs). */
export async function ensureFastStopsForMove(
  moveId: string,
  locale: "en" | "es" = "en"
): Promise<StoredMoveRoutesPayload | null> {
  const stored = await loadStoredMoveRoutes(moveId);
  if (!stored) return null;
  if (hasStoredStops(stored.stopsByIndex)) return stored;

  const move = await prisma.move.findUnique({
    where: { id: moveId },
    include: { user: { select: { name: true, email: true } } },
  });
  if (!move) return stored;

  const profile = moveToProfile(move.user, move);
  const vehicles = await loadVehiclesWithMpg(moveId);
  const stopsByIndex = buildFastStopsForAlternatives(
    stored.alternatives,
    profile,
    move.rentalPreference,
    vehicles,
    locale
  );

  await prisma.move.update({
    where: { id: moveId },
    data: {
      routeStopsByIndex: stopsByIndex as unknown as Prisma.InputJsonValue,
    },
  });

  return {
    ...stored,
    stopsByIndex,
  };
}

/** OSRM geometry + instant fallback stops saved together. */
export async function syncMoveRoutesGeometry(moveId: string, locale: "en" | "es" = "en"): Promise<boolean> {
  const move = await prisma.move.findUnique({
    where: { id: moveId },
    include: {
      user: { select: { name: true, email: true } },
    },
  });

  if (!move) return false;

  const profile = moveToProfile(move.user, move);
  const points = await resolveRoutePointsFromCityCenter(profile);
  if (!points) return false;

  try {
    const alternativesRaw = await fetchOsrmRoutes(points.from, points.to, 3);
    if (!alternativesRaw.length) return false;

    const alternatives: StoredRouteAlternative[] = alternativesRaw.map((alt) => ({
      index: alt.index,
      distanceMiles: Math.round(alt.distanceMiles),
      durationHours: alt.durationHours,
      driveTimeLabel: formatDriveTime(alt.durationHours),
      coordinates: simplifyRouteCoordinates(alt.coordinates, 200),
      usesInterstate: alt.usesInterstate,
      interstateRefs: alt.interstateRefs,
    }));

    const vehicles = await loadVehiclesWithMpg(moveId);
    const stopsByIndex = buildFastStopsForAlternatives(
      alternatives,
      profile,
      move.rentalPreference,
      vehicles,
      locale
    );

    await prisma.move.update({
      where: { id: moveId },
      data: {
        routeAlternatives: alternatives as unknown as Prisma.InputJsonValue,
        routeStopsByIndex: stopsByIndex as unknown as Prisma.InputJsonValue,
        routesComputedAt: new Date(),
      },
    });

    return true;
  } catch (error) {
    console.error("syncMoveRoutesGeometry error:", error);
    return false;
  }
}

export async function syncMoveRoutes(moveId: string, locale: "en" | "es" = "en"): Promise<boolean> {
  return syncMoveRoutesGeometry(moveId, locale);
}

export function scheduleMoveRouteStopsSync(_moveId: string, _locale: "en" | "es" = "en") {
  /* Stops are generated synchronously with geometry; kept for API compatibility. */
}

export async function ensureMoveRoutes(
  moveId: string,
  locale: "en" | "es" = "en"
): Promise<StoredMoveRoutesPayload | null> {
  let stored = await loadStoredMoveRoutes(moveId);
  if (!stored) {
    const synced = await syncMoveRoutesGeometry(moveId, locale);
    if (!synced) return null;
    stored = await loadStoredMoveRoutes(moveId);
  }
  if (!stored) return null;
  if (!hasStoredStops(stored.stopsByIndex)) {
    stored = await ensureFastStopsForMove(moveId, locale);
  }
  return stored;
}

export function storedRoutesMatchMove(
  stored: StoredMoveRoutesPayload,
  move: {
    originLat: number | null;
    originLon: number | null;
    destinationLat: number | null;
    destinationLon: number | null;
  }
): boolean {
  return coordsMatch(stored, move);
}

export function routesNeedStops(stored: StoredMoveRoutesPayload): boolean {
  return !hasStoredStops(stored.stopsByIndex);
}
