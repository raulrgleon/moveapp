"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useMove } from "@/contexts/move-context";
import { useAuth } from "@/contexts/auth-context";
import type { RouteStop } from "@/lib/types";
import { computeTravelDays } from "@/lib/geo/route-service";
import { subscribeProfileUpdated } from "@/lib/move/refresh-data";
import { apiFetch } from "@/lib/api-client";

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
  usesInterstate?: boolean;
  interstateRefs?: string[];
}

export interface RouteStatsResponse {
  distanceMiles: number;
  durationHours: number;
  driveTimeLabel: string;
  travelDays: number;
  stopCount: number;
  stops: RouteStop[];
  alternatives: RouteAlternativeSummary[];
  selectedRouteIndex: number;
}

interface MoveRoutesApiResponse {
  alternatives: RouteAlternativeSummary[];
  stopsByIndex: Record<number, RouteStop[]>;
  selectedRouteIndex: number;
  distanceMiles: number;
  durationHours: number;
  driveTimeLabel: string;
  stopCount: number;
  stopsPending?: boolean;
}

function normalizeAlternative(
  alt: Partial<RouteAlternativeSummary> | null | undefined,
  fallbackIndex: number
): RouteAlternativeSummary {
  const index = typeof alt?.index === "number" ? alt.index : fallbackIndex;
  const distanceMiles = Number.isFinite(alt?.distanceMiles) ? Number(alt?.distanceMiles) : 0;
  const durationHours = Number.isFinite(alt?.durationHours) ? Number(alt?.durationHours) : 0;
  const driveTimeLabel =
    typeof alt?.driveTimeLabel === "string" && alt.driveTimeLabel.trim().length > 0
      ? alt.driveTimeLabel
      : `${durationHours.toFixed(1)}h`;
  const coordinates = Array.isArray(alt?.coordinates)
    ? alt.coordinates.filter(
        (coord): coord is [number, number] =>
          Array.isArray(coord) &&
          coord.length === 2 &&
          Number.isFinite(coord[0]) &&
          Number.isFinite(coord[1])
      )
    : [];

  return {
    index,
    distanceMiles,
    durationHours,
    driveTimeLabel,
    coordinates,
    usesInterstate: Boolean(alt?.usesInterstate),
    interstateRefs: Array.isArray(alt?.interstateRefs)
      ? alt.interstateRefs.filter((ref): ref is string => typeof ref === "string")
      : [],
  };
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
  lastPrefetchKey = null;
}

export interface PrefetchRouteInput {
  profile: {
    origin: string;
    destination: string;
    originLat?: number | null;
    originLon?: number | null;
    pets: boolean;
    rentalPreference?: string;
  };
  destLat: number;
  destLon: number;
  selectedRouteIndex?: number;
  useStoredRoutes?: boolean;
}

let lastPrefetchKey: string | null = null;
let prefetchInflight: Promise<void> | null = null;

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

function apiResponseToStats(json: MoveRoutesApiResponse): RouteStatsResponse {
  const alternatives = Array.isArray(json.alternatives)
    ? json.alternatives.map((alt, idx) => normalizeAlternative(alt, idx))
    : [];
  const stopsByIndex = json.stopsByIndex ?? {};
  const selected =
    alternatives.find((alt) => alt.index === json.selectedRouteIndex) ??
    alternatives[json.selectedRouteIndex] ??
    alternatives[0];

  return {
    alternatives,
    stops: stopsByIndex[json.selectedRouteIndex] ?? stopsByIndex[0] ?? [],
    selectedRouteIndex: json.selectedRouteIndex,
    distanceMiles: selected?.distanceMiles ?? json.distanceMiles,
    durationHours: selected?.durationHours ?? json.durationHours,
    driveTimeLabel: selected?.driveTimeLabel ?? json.driveTimeLabel,
    travelDays: computeTravelDays(selected?.durationHours ?? json.durationHours),
    stopCount: json.stopCount,
  };
}

function hasPlaceholderHotels(stopsByIndex: Record<number, RouteStop[]>): boolean {
  return Object.values(stopsByIndex).some((stops) =>
    stops.some(
      (stop) =>
        (stop.type === "hotel" || stop.type === "pet_hotel") &&
        /^Night\s+\d+/i.test(stop.location.trim())
    )
  );
}

async function fetchStoredMoveRoutes(opts?: { bypassCache?: boolean }): Promise<{
  stats: RouteStatsResponse;
  stopsByIndex: Record<number, RouteStop[]>;
  stopsPending: boolean;
}> {
  if (opts?.bypassCache) {
    routeStatsCache.delete("stored");
    routeStopsAllCache.delete("stored-stops");
    routeStatsInflight.delete("stored");
    routeStopsAllInflight.delete("stored-stops");
  }
  const res = await apiFetch("/api/move/routes");
  const json = (await res.json()) as MoveRoutesApiResponse;
  const stats = apiResponseToStats(json);
  const stopsByIndex = json.stopsByIndex ?? {};
  return {
    stats,
    stopsByIndex,
    stopsPending: Boolean(json.stopsPending) || hasPlaceholderHotels(stopsByIndex),
  };
}

export function seedRouteStatsCache(payload: MoveRoutesApiResponse) {
  const stats = apiResponseToStats(payload);
  routeStatsCache.set("stored", { at: Date.now(), data: stats });
  routeStopsAllCache.set("stored-stops", {
    at: Date.now(),
    stopsByIndex: payload.stopsByIndex ?? {},
  });
}

async function fetchRouteStatsCached(
  params: URLSearchParams,
  useStoredRoutes: boolean
): Promise<RouteStatsResponse> {
  const key = useStoredRoutes ? "stored" : params.toString();
  const cached = routeStatsCache.get(key);
  if (cached && Date.now() - cached.at < CLIENT_ROUTE_CACHE_TTL_MS) {
    return cached.data;
  }

  const inflight = routeStatsInflight.get(key);
  if (inflight) return inflight;

  const promise = (useStoredRoutes
    ? fetchStoredMoveRoutes().then(({ stats }) => stats)
    : apiFetch(`/api/route?${params.toString()}`).then(async (res) => {
        return (await res.json()) as RouteStatsResponse;
      })
  )
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
  params: URLSearchParams,
  useStoredRoutes: boolean
): Promise<Record<number, RouteStop[]>> {
  const key = useStoredRoutes ? "stored-stops" : params.toString();
  const cached = routeStopsAllCache.get(key);
  if (cached && Date.now() - cached.at < CLIENT_ROUTE_CACHE_TTL_MS) {
    return cached.stopsByIndex;
  }

  const inflight = routeStopsAllInflight.get(key);
  if (inflight) return inflight;

  const promise = (useStoredRoutes
    ? fetchStoredMoveRoutes().then(({ stopsByIndex }) => stopsByIndex)
    : apiFetch(`/api/route?${params.toString()}`).then(async (res) => {
        const json = (await res.json()) as { stopsByIndex?: Record<number, RouteStop[]> };
        return json.stopsByIndex ?? {};
      })
  )
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

/** Preload all 3 route geometries + stops when the dashboard session starts. */
export function prefetchRouteSession(input: PrefetchRouteInput): Promise<void> {
  const useStoredRoutes = input.useStoredRoutes ?? true;
  const key = [
    useStoredRoutes ? "stored" : "live",
    input.profile.origin,
    input.profile.destination,
    input.profile.originLat,
    input.profile.originLon,
    input.destLat,
    input.destLon,
    input.profile.pets,
    input.profile.rentalPreference ?? "",
  ].join("|");

  if (lastPrefetchKey === key) {
    if (prefetchInflight) return prefetchInflight;
    const cacheKey = useStoredRoutes ? "stored" : buildRouteParams(input.profile, input.destLat, input.destLon, { geometryOnly: "1" }).toString();
    if (routeStatsCache.has(cacheKey)) return Promise.resolve();
  }

  const hasCoords =
    input.profile.originLat != null &&
    input.profile.originLon != null &&
    input.destLat != null &&
    input.destLon != null;

  if (!hasCoords && !useStoredRoutes) {
    return Promise.resolve();
  }

  lastPrefetchKey = key;

  prefetchInflight = (async () => {
    const geometryParams = buildRouteParams(input.profile, input.destLat, input.destLon, {
      geometryOnly: "1",
    });
    const stopsParams = buildRouteParams(input.profile, input.destLat, input.destLon, {
      stopsAll: "1",
      routeIndex: "0",
    });

    await Promise.all([
      fetchRouteStatsCached(geometryParams, useStoredRoutes),
      fetchAllRouteStopsCached(stopsParams, useStoredRoutes),
    ]);

  })().finally(() => {
    if (lastPrefetchKey === key) prefetchInflight = null;
  });

  return prefetchInflight;
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
  const { isAuthenticated, user, isHydrated: authHydrated } = useAuth();
  const useStoredRoutes = authHydrated && isAuthenticated && user?.role !== "admin";

  const [baseStats, setBaseStats] = useState<Omit<
    RouteStatsResponse,
    "distanceMiles" | "durationHours" | "driveTimeLabel" | "travelDays" | "stops" | "selectedRouteIndex"
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
        useStoredRoutes ? "stored" : "live",
        profile.origin,
        profile.destination,
        profile.originLat,
        profile.originLon,
        destLat,
        destLon,
        profile.pets,
        profile.rentalPreference,
        vehicleFingerprint,
        profileVersion,
      ].join("|"),
    [
      useStoredRoutes,
      profile.origin,
      profile.destination,
      profile.originLat,
      profile.originLon,
      destLat,
      destLon,
      profile.pets,
      profile.rentalPreference,
      vehicleFingerprint,
      profileVersion,
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
    if (!isHydrated || !authHydrated) return;

    const hasCoords =
      profile.originLat != null &&
      profile.originLon != null &&
      destLat != null &&
      destLon != null;

    if (!hasCoords && !useStoredRoutes) {
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
        if (useStoredRoutes) {
          const { stats, stopsByIndex: allStops, stopsPending } = await fetchStoredMoveRoutes();
          if (cancelled) return;
          setBaseStats({
            stopCount: stats.stopCount,
            alternatives: stats.alternatives,
          });
          setStopsByIndex(allStops);
          setLoading(false);

          // Placeholders load instantly; poll until hotels get real street addresses.
          if (stopsPending || hasPlaceholderHotels(allStops)) {
            setStopsLoading(true);
            let latest = allStops;
            for (let attempt = 0; attempt < 16; attempt++) {
              await new Promise((r) => setTimeout(r, 2500));
              if (cancelled) return;
              const refreshed = await fetchStoredMoveRoutes({ bypassCache: true });
              latest = refreshed.stopsByIndex;
              setStopsByIndex(latest);
              if (!refreshed.stopsPending && !hasPlaceholderHotels(latest)) break;
            }
            if (!cancelled) setStopsLoading(false);
          } else {
            setStopsLoading(false);
          }
          return;
        }

        const geometryParams = buildRouteParams(profile, destLat!, destLon!, {
          geometryOnly: "1",
        });
        const res = await fetchRouteStatsCached(geometryParams, false);
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
        const allStops = await fetchAllRouteStopsCached(stopsParams, false);
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
  }, [isHydrated, authHydrated, routeQueryKey, destLat, destLon, profileVersion, profile, useStoredRoutes]);

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
      travelDays: computeTravelDays(selectedAlternative.durationHours),
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
