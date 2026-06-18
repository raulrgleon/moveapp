"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMove } from "@/contexts/move-context";
import { useAuth } from "@/contexts/auth-context";
import type { RouteStop } from "@/lib/types";
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

const ROUTE_INDEX_KEY = "movepilot_selected_route";
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
  if (typeof window === "undefined") return 0;
  const v = localStorage.getItem(ROUTE_INDEX_KEY);
  const n = v ? parseInt(v, 10) : 0;
  return Number.isFinite(n) && n >= 0 ? n : 0;
}

export function storeRouteIndex(index: number) {
  if (typeof window === "undefined") return;
  localStorage.setItem(ROUTE_INDEX_KEY, String(index));
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
  const { isAuthenticated } = useAuth();
  const { profile, lat, lon, isHydrated, vehicles, canEdit } = useMove();
  const [baseStats, setBaseStats] = useState<Omit<
    RouteStatsResponse,
    "distanceMiles" | "durationHours" | "driveTimeLabel" | "stops" | "selectedRouteIndex"
  > | null>(null);
  const [stopsByIndex, setStopsByIndex] = useState<Record<number, RouteStop[]>>({});
  const [loading, setLoading] = useState(true);
  const [stopsLoading, setStopsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [routeIndex, setRouteIndexState] = useState(0);
  const routeIndexRef = useRef(0);

  const destLat = profile.destinationLat ?? lat;
  const destLon = profile.destinationLon ?? lon;

  useEffect(() => {
    const stored = getStoredRouteIndex();
    routeIndexRef.current = stored;
    setRouteIndexState(stored);
  }, []);

  useEffect(() => {
    if (!isHydrated || !isAuthenticated) return;
    void (async () => {
      try {
        const res = await apiFetch("/api/move/route-index");
        if (!res.ok) return;
        const json = (await res.json()) as { routeIndex?: number };
        if (typeof json.routeIndex === "number") {
          storeRouteIndex(json.routeIndex);
          routeIndexRef.current = json.routeIndex;
          setRouteIndexState(json.routeIndex);
        }
      } catch {
        /* use localStorage fallback */
      }
    })();
  }, [isHydrated, isAuthenticated]);

  const setRouteIndex = useCallback(
    (index: number) => {
      if (index === routeIndexRef.current) return;
      routeIndexRef.current = index;
      setRouteIndexState(index);

      if (!isAuthenticated || !canEdit) return;

      storeRouteIndex(index);

      void (async () => {
        try {
          const res = await apiFetch("/api/move/route-index", {
            method: "PATCH",
            body: JSON.stringify({ routeIndex: index, syncBudget: true }),
          });
          if (!res.ok) return;
          const json = (await res.json()) as { budgetDelta?: RouteBudgetDelta | null };
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("movepilot:budget-route-sync", {
                detail: json.budgetDelta ?? null,
              })
            );
          }
        } catch {
          /* sync best-effort */
        }
      })();
    },
    [isAuthenticated, canEdit]
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
      ].join("|"),
    [
      profile.origin,
      profile.destination,
      profile.originLat,
      profile.originLon,
      destLat,
      destLon,
      profile.pets,
    ]
  );

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
  }, [
    isHydrated,
    routeQueryKey,
    profile.origin,
    profile.destination,
    profile.originLat,
    profile.originLon,
    profile.pets,
    destLat,
    destLon,
  ]);

  const selectedAlternative = useMemo(
    () => pickAlternative(baseStats?.alternatives ?? [], routeIndex),
    [baseStats?.alternatives, routeIndex]
  );

  const stops = stopsByIndex[routeIndex] ?? stopsByIndex[0] ?? [];

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
