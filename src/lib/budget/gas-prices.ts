import { parseCityStateLabel, normalizeUsState } from "@/lib/geo/address-region";
import {
  STATE_GAS_PRICE,
  US_AVG_GAS_PRICE,
} from "@/lib/cost-of-living/state-data";
import type { RouteStop } from "@/lib/types";

const EPA_FUEL_URL = "https://www.fueleconomy.gov/ws/rest/fuelprices";
const CACHE_MS = 6 * 60 * 60 * 1000;

let liveCache: { regular: number; fetchedAt: number } | null = null;

function stateFromLocation(location: string): string | null {
  const parts = location.split(",").map((p) => p.trim());
  if (parts.length >= 2) {
    const statePart = parts[parts.length - 2] ?? parts[parts.length - 1];
    return normalizeUsState(statePart);
  }
  return null;
}

function stateFromLabel(label: string): string | null {
  const { state } = parseCityStateLabel(label);
  return state ? normalizeUsState(state) : null;
}

export async function fetchLiveElectricPricePerKwh(): Promise<number> {
  try {
    const res = await fetch(EPA_FUEL_URL, {
      headers: { Accept: "application/json" },
      next: { revalidate: 21600 },
    });
    if (!res.ok) return 0.15;
    const data = (await res.json()) as { electric?: string | number };
    const price = Number(data.electric);
    return Number.isFinite(price) && price > 0 ? price : 0.15;
  } catch {
    return 0.15;
  }
}

export async function fetchLiveRegularGasPrice(): Promise<number> {
  if (liveCache && Date.now() - liveCache.fetchedAt < CACHE_MS) {
    return liveCache.regular;
  }
  try {
    const res = await fetch(EPA_FUEL_URL, {
      headers: { Accept: "application/json" },
      next: { revalidate: 21600 },
    });
    if (!res.ok) throw new Error("fuel prices unavailable");
    const data = (await res.json()) as { regular?: string | number };
    const regular = Number(data.regular);
    if (!Number.isFinite(regular) || regular <= 0) throw new Error("invalid price");
    liveCache = { regular, fetchedAt: Date.now() };
    return regular;
  } catch {
    return US_AVG_GAS_PRICE;
  }
}

/** Scale static state table to current national average from EPA. */
export async function gasPriceForState(
  state: string | null,
  liveNational?: number
): Promise<number> {
  const live = liveNational ?? (await fetchLiveRegularGasPrice());
  if (!state || !STATE_GAS_PRICE[state]) return live;
  const ratio = STATE_GAS_PRICE[state] / US_AVG_GAS_PRICE;
  return Math.round(live * ratio * 100) / 100;
}

export async function gasPriceForLocation(
  location: string,
  liveNational?: number
): Promise<number> {
  return gasPriceForState(stateFromLocation(location), liveNational);
}

/** Weighted average $/gal using real gas stops on the route, else origin + destination states. */
export async function averageGasPriceAlongRoute(
  origin: string,
  destination: string,
  routeStops: RouteStop[] = []
): Promise<number> {
  const live = await fetchLiveRegularGasPrice();
  const gasStops = routeStops.filter((s) => s.type === "gas");

  const priced = gasStops
    .map((s) => s.gasPricePerGallon)
    .filter((p): p is number => p != null && p > 0);

  if (priced.length > 0) {
    return Math.round((priced.reduce((a, b) => a + b, 0) / priced.length) * 100) / 100;
  }

  const states = new Set<string>();
  for (const label of [origin, destination]) {
    const st = stateFromLabel(label);
    if (st) states.add(st);
  }

  if (states.size === 0) return live;

  const prices = await Promise.all(Array.from(states).map((st) => gasPriceForState(st, live)));
  return Math.round((prices.reduce((a, b) => a + b, 0) / prices.length) * 100) / 100;
}
