import { parseCityStateLabel, normalizeUsState } from "@/lib/geo/address-region";
import {
  STATE_HOTEL_NIGHTLY,
  US_AVG_HOTEL_NIGHTLY,
} from "@/lib/cost-of-living/state-data";
import type { RouteStop } from "@/lib/types";

export interface HotelNightEstimate {
  name: string;
  location: string;
  pricePerNight: number;
  night: number;
}

function stateFromLocation(location: string): string | null {
  const parts = location.split(",").map((p) => p.trim());
  if (parts.length >= 2) {
    const statePart = parts[parts.length - 2] ?? parts[parts.length - 1];
    return normalizeUsState(statePart);
  }
  return null;
}

export function regionalHotelNightlyRate(origin: string, destination: string, pets = false): number {
  const states = new Set<string>();
  for (const label of [origin, destination]) {
    const { state } = parseCityStateLabel(label);
    const norm = state ? normalizeUsState(state) : null;
    if (norm) states.add(norm);
  }
  const rates = Array.from(states).map((s) => STATE_HOTEL_NIGHTLY[s] ?? US_AVG_HOTEL_NIGHTLY);
  const base =
    rates.length > 0
      ? Math.round(rates.reduce((a, b) => a + b, 0) / rates.length)
      : US_AVG_HOTEL_NIGHTLY;
  return pets ? Math.round(base * 1.12) : base;
}

/** Estimate nightly rate from OSM tags and regional averages. */
export function estimateHotelNightlyRate(
  tags: Record<string, string> | undefined,
  location: string,
  petFriendly: boolean
): number {
  const state = stateFromLocation(location);
  const base = state ? (STATE_HOTEL_NIGHTLY[state] ?? US_AVG_HOTEL_NIGHTLY) : US_AVG_HOTEL_NIGHTLY;

  const stars = parseInt(tags?.stars ?? "3", 10);
  const name = (tags?.name ?? tags?.brand ?? "").toLowerCase();
  const isMotel = /motel/i.test(name) || tags?.tourism === "motel";
  const isBudget = /super 8|motel 6|days inn|red roof|travelodge|americas best/i.test(name);
  const isUpscale = /marriott|hilton|hyatt|westin|sheraton|embassy/i.test(name);

  let rate = base;
  if (isBudget || isMotel) rate = base * 0.78;
  else if (isUpscale || stars >= 4) rate = base * 1.38;
  else if (stars <= 2) rate = base * 0.85;

  if (petFriendly) rate *= 1.12;

  return Math.round(rate);
}

export function hotelEstimatesFromStops(stops: RouteStop[]): HotelNightEstimate[] {
  const hotelStops = stops.filter((s) => s.type === "hotel" || s.type === "pet_hotel");
  let night = 1;
  return hotelStops.map((stop) => ({
    name: stop.name,
    location: stop.location,
    pricePerNight: stop.estimatedPrice ?? US_AVG_HOTEL_NIGHTLY,
    night: night++,
  }));
}

export function totalHotelCost(stops: RouteStop[]): number {
  return hotelEstimatesFromStops(stops).reduce((sum, h) => sum + h.pricePerNight, 0);
}
