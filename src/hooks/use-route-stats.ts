"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useMove } from "@/contexts/move-context";
import { useAuth } from "@/contexts/auth-context";
import type { RouteStop } from "@/lib/types";
import { apiFetch } from "@/lib/api-client";
import { dispatchProfileUpdated } from "@/lib/move/profile-events";

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

const routeStatsCache = new Map<string, CachedRoutePayload>();
const routeStatsInflight = new Map<string, Promise<RouteStatsResponse>>();
const routeStopsCache = new Map<string, { at: number; stops: RouteStop[] }>();
const routeStopsInflight = new Map<string, Promise<RouteStop[]>>();

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

async function fetchRouteStopsCached(params: URLSearchParams): Promise<RouteStop[]> {
  const key = params.toString();
  const cached = routeStopsCache.get(key);
  if (cached && Date.now() - cached.at < CLIENT_ROUTE_CACHE_TTL_MS) {
    return cached.stops;
  }

  const inflight = routeStopsInflight.get(key);
  if (inflight) return inflight;

  const promise = fetch(`/api/route?${key}`)
    .then(async (res) => {
      if (!res.ok) throw new Error("stops failed");
      const json = (await res.json()) as Pick<RouteStatsResponse, "stops">;
      return json.stops;
    })
    .then((stops) => {
      routeStopsCache.set(key, { at: Date.now(), stops });
      return stops;
    })
    .finally(() => {
      routeStopsInflight.delete(key);
    });

  routeStopsInflight.set(key, promise);
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
  const { profile, lat, lon, isHydrated, profileVersion, vehicles, canEdit } = useMove();
  const [baseStats, setBaseStats] = useState<Omit<
    RouteStatsResponse,
    "distanceMiles" | "durationHours" | "driveTimeLabel" | "stops" | "selectedRouteIndex"
  > | null>(null);
  const [stops, setStops] = useState<RouteStop[]>([]);
  const [loading, setLoading] = useState(true);
  const [stopsLoading, setStopsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [routeIndex, setRouteIndexState] = useState(0);
  const routeIndexRef = useRef(0);
  const lastStopsRouteIndexRef = useRef<number | null>(null);

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
  }, [isHydrated, isAuthenticated, profileVersion]);

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
          dispatchProfileUpdated();
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
        profileVersion,
      ].join("|"),
    [
      profile.origin,
      profile.destination,
      profile.originLat,
      profile.originLon,
      destLat,
      destLon,
      profile.pets,
      profileVersion,
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
      setStops([]);
      setLoading(false);
      setError("missing_coords");
      lastStopsRouteIndexRef.current = null;
      return;
    }

    let cancelled = false;
    lastStopsRouteIndexRef.current = null;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const initialIndex = routeIndexRef.current;
        const params = new URLSearchParams({
          origin: profile.origin,
          destination: profile.destination,
          originLat: String(profile.originLat),
          originLon: String(profile.originLon),
          destinationLat: String(destLat),
          destinationLon: String(destLon),
          pets: String(profile.pets),
          routeIndex: String(initialIndex),
          geometryOnly: "1",
        });
        const res = await fetchRouteStatsCached(params);
        if (cancelled) return;
        setBaseStats({
          stopCount: res.stopCount,
          alternatives: res.alternatives,
        });
        setStops([]);
        lastStopsRouteIndexRef.current = null;
      } catch {
        if (!cancelled) {
          setBaseStats(null);
          setStops([]);
          setError("fetch_failed");
        }
      } finally {
        if (!cancelled) setLoading(false);
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

  useEffect(() => {
    if (!isHydrated || !baseStats?.alternatives.length) return;

    const hasCoords =
      profile.originLat != null &&
      profile.originLon != null &&
      destLat != null &&
      destLon != null;
    if (!hasCoords) return;

    if (lastStopsRouteIndexRef.current === routeIndex) return;

    let cancelled = false;

    async function loadStopsForRoute() {
      setStopsLoading(true);
      try {
        const params = new URLSearchParams({
          origin: profile.origin,
          destination: profile.destination,
          originLat: String(profile.originLat),
          originLon: String(profile.originLon),
          destinationLat: String(destLat),
          destinationLon: String(destLon),
          pets: String(profile.pets),
          routeIndex: String(routeIndex),
          stopsOnly: "1",
        });
        const nextStops = await fetchRouteStopsCached(params);
        if (!cancelled) {
          setStops(nextStops);
          lastStopsRouteIndexRef.current = routeIndex;
        }
      } catch {
        /* keep previous stops */
      } finally {
        if (!cancelled) setStopsLoading(false);
      }
    }

    void loadStopsForRoute();
    return () => {
      cancelled = true;
    };
  }, [
    routeIndex,
    isHydrated,
    baseStats?.alternatives.length,
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
