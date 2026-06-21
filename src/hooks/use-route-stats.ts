"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useMove } from "@/contexts/move-context";
import type { RouteStop } from "@/lib/types";
import { subscribeProfileUpdated } from "@/lib/move/refresh-data";

export interface RouteBudgetDelta {
  previousEstimated: number;
  newEstimated: number;
  delta: number;
}

export interface RouteAlternativeSummary {
  index: number;
  distanceMiles: number;
  durationHours: number;
  driveTimeLabel: string;
  coordinates: [number, number][];
}

export interface RouteStatsResponse {
  distanceMiles: number;
  durationHours: number;
  driveTimeLabel: string;
  stopCount: number;
  stops: RouteStop[];
  alternatives: RouteAlternativeSummary[];
  selectedRouteIndex: number;
}

const CLIENT_ROUTE_CACHE_TTL_MS = 5 * 60 * 1000;

interface CachedRoutePayload {
  at: number;
  data: RouteStatsResponse;
}

interface CachedStopsPayload {
  at: number;
  stopsByIndex: Record<number, RouteStop[]>;
}

const routeStatsCache = new Map<string, CachedRoutePayload>();
const routeStatsInflight = new Map<string, Promise<RouteStatsResponse>>();
const routeStopsAllCache = new Map<string, CachedStopsPayload>();
const routeStopsAllInflight = new Map<string, Promise<Record<number, RouteStop[]>>>();

export function invalidateRouteStatsCache() {
  routeStatsCache.clear();
  routeStopsAllCache.clear();
}

function buildRouteParams(
  profile: {
    origin: string;
    destination: string;
    originLat?: number | null;
    originLon?: number | null;
    pets: boolean;
  },
  destLat: number,
  destLon: number,
  extra?: Record<string, string>
): URLSearchParams {
  return new URLSearchParams({
    origin: profile.origin,
    destination: profile.destination,
    originLat: String(profile.originLat),
    originLon: String(profile.originLon),
    destinationLat: String(destLat),
    destinationLon: String(destLon),
    pets: String(profile.pets),
    ...extra,
  });
}

async function fetchRouteStatsCached(
  params: URLSearchParams
): Promise<RouteStatsResponse> {
  const key = params.toString();
  const cached = routeStatsCache.get(key);
  if (cached && Date.now() - cached.at < CLIENT_ROUTE_CACHE_TTL_MS) {
    return cached.data;
  }

  const inflight = routeStatsInflight.get(key);
  if (inflight) return inflight;

  const promise = fetch(`/api/route?${key}`)
    .then(async (res) => {
      if (!res.ok) throw new Error("route failed");
      return (await res.json()) as RouteStatsResponse;
    })
    .then((data) => {
      routeStatsCache.set(key, { at: Date.now(), data });
      return data;
    })
    .finally(() => {
      routeStatsInflight.delete(key);
    });

  routeStatsInflight.set(key, promise);
  return promise;
}

async function fetchAllRouteStopsCached(
  params: URLSearchParams
): Promise<Record<number, RouteStop[]>> {
  const key = params.toString();
  const cached = routeStopsAllCache.get(key);
  if (cached && Date.now() - cached.at < CLIENT_ROUTE_CACHE_TTL_MS) {
    return cached.stopsByIndex;
  }

  const inflight = routeStopsAllInflight.get(key);
  if (inflight) return inflight;

  const promise = fetch(`/api/route?${key}`)
    .then(async (res) => {
      if (!res.ok) throw new Error("stops failed");
      const json = (await res.json()) as { stopsByIndex?: Record<number, RouteStop[]> };
      return json.stopsByIndex ?? {};
    })
    .then((stopsByIndex) => {
      routeStopsAllCache.set(key, { at: Date.now(), stopsByIndex });
      return stopsByIndex;
    })
    .finally(() => {
      routeStopsAllInflight.delete(key);
    });

  routeStopsAllInflight.set(key, promise);
  return promise;
}

export function getStoredRouteIndex(): number {
  return 0;
}

export function storeRouteIndex(_index: number) {
  /* route index is persisted in PostgreSQL via MoveContext */
}

function pickAlternative(
  alternatives: RouteAlternativeSummary[],
  index: number
): RouteAlternativeSummary | null {
  if (!alternatives.length) return null;
  return (
    alternatives.find((alt) => alt.index === index) ??
    alternatives[index] ??
    alternatives[0] ??
    null
  );
}

export function useRouteStats() {
  const {
    profile,
    lat,
    lon,
    isHydrated,
    vehicles,
    profileVersion,
    selectedRouteIndex: routeIndex,
    setSelectedRouteIndex,
  } = useMove();
  const [baseStats, setBaseStats] = useState<Omit<
    RouteStatsResponse,
    "distanceMiles" | "durationHours" | "driveTimeLabel" | "stops" | "selectedRouteIndex"
  > | null>(null);
  const [stopsByIndex, setStopsByIndex] = useState<Record<number, RouteStop[]>>({});
  const [loading, setLoading] = useState(true);
  const [stopsLoading, setStopsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const destLat = profile.destinationLat ?? lat;
  const destLon = profile.destinationLon ?? lon;

  const setRouteIndex = useCallback(
    (index: number) => {
      setSelectedRouteIndex(index, true);
    },
    [setSelectedRouteIndex]
  );

  const vehicleFingerprint = useMemo(
    () =>
      vehicles
        .map(
          (v) =>
            `${v.id}:${v.make}:${v.model}:${v.combMpg ?? ""}:${v.needsTransport ? 1 : 0}:${v.fuelType ?? ""}`
        )
        .join("|"),
    [vehicles]
  );

  const routeQueryKey = useMemo(
    () =>
      [
        profile.origin,
        profile.destination,
        profile.originLat,
        profile.originLon,
        destLat,
        destLon,
        profile.pets,
        profile.rentalPreference,
        vehicleFingerprint,
      ].join("|"),
    [
      profile.origin,
      profile.destination,
      profile.originLat,
      profile.originLon,
      destLat,
      destLon,
      profile.pets,
      profile.rentalPreference,
      vehicleFingerprint,
    ]
  );

  useEffect(() => {
    return subscribeProfileUpdated(() => {
      invalidateRouteStatsCache();
    });
  }, []);

  useEffect(() => {
    invalidateRouteStatsCache();
  }, [vehicleFingerprint, profileVersion]);

  useEffect(() => {
    if (!isHydrated) return;

    const hasCoords =
      profile.originLat != null &&
      profile.originLon != null &&
      destLat != null &&
      destLon != null;

    if (!hasCoords) {
      setBaseStats(null);
      setStopsByIndex({});
      setLoading(false);
      setError("missing_coords");
      return;
    }

    let cancelled = false;

    async function load() {
      setLoading(true);
      setStopsLoading(true);
      setError(null);
      setStopsByIndex({});

      try {
        const geometryParams = buildRouteParams(profile, destLat!, destLon!, {
          geometryOnly: "1",
        });
        const res = await fetchRouteStatsCached(geometryParams);
        if (cancelled) return;

        setBaseStats({
          stopCount: res.stopCount,
          alternatives: res.alternatives,
        });
        setLoading(false);

        const stopsParams = buildRouteParams(profile, destLat!, destLon!, {
          stopsAll: "1",
          routeIndex: "0",
        });
        const allStops = await fetchAllRouteStopsCached(stopsParams);
        if (!cancelled) setStopsByIndex(allStops);
      } catch {
        if (!cancelled) {
          setBaseStats(null);
          setStopsByIndex({});
          setError("fetch_failed");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
          setStopsLoading(false);
        }
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [isHydrated, routeQueryKey, destLat, destLon, profileVersion, profile]);

  const selectedAlternative = useMemo(
    () => pickAlternative(baseStats?.alternatives ?? [], routeIndex),
    [baseStats?.alternatives, routeIndex]
  );

  const stops = useMemo(
    () => stopsByIndex[routeIndex] ?? stopsByIndex[0] ?? [],
    [stopsByIndex, routeIndex]
  );

  const stats: RouteStatsResponse | null = useMemo(() => {
    if (!baseStats || !selectedAlternative) return null;
    return {
      stopCount: baseStats.stopCount,
      alternatives: baseStats.alternatives,
      selectedRouteIndex: routeIndex,
      stops,
      distanceMiles: selectedAlternative.distanceMiles,
      durationHours: selectedAlternative.durationHours,
      driveTimeLabel: selectedAlternative.driveTimeLabel,
    };
  }, [baseStats, selectedAlternative, routeIndex, stops]);

  return {
    stats,
    loading,
    stopsLoading,
    error,
    routeIndex,
    setRouteIndex,
    vehicleCount: Math.max(1, vehicles.length),
  };
}
