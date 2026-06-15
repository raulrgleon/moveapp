import type { VehicleInfo } from "./types";

const EPA_BASE = "https://www.fueleconomy.gov/ws/rest";

export interface VehicleMpgProfile {
  combMpg: number;
  cityMpg: number;
  highwayMpg: number;
  fuelType: string;
  epaVehicleId?: string;
  drive?: string;
}

type EpaMenuItem = { text: string; value: string };

async function epaGet<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${EPA_BASE}${path}`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

function normalizeToken(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function bestMenuMatch(query: string, items: EpaMenuItem[]): EpaMenuItem | null {
  if (!items.length) return null;
  const q = normalizeToken(query);
  const exact = items.find((i) => normalizeToken(i.text) === q || normalizeToken(i.value) === q);
  if (exact) return exact;

  const contains = items.filter(
    (i) => normalizeToken(i.text).includes(q) || q.includes(normalizeToken(i.text))
  );
  if (contains.length === 1) return contains[0];
  if (contains.length > 1) {
    return contains.sort((a, b) => a.text.length - b.text.length)[0];
  }

  return items[0];
}

function pickVehicleOption(options: EpaMenuItem[], trim?: string): EpaMenuItem | null {
  if (!options.length) return null;
  if (trim?.trim()) {
    const t = trim.toLowerCase();
    const trimMatch = options.find((o) => o.text.toLowerCase().includes(t));
    if (trimMatch) return trimMatch;
  }
  const auto = options.find((o) => /auto|cvt|variable/i.test(o.text));
  return auto ?? options[0];
}

function parseMpgRecord(data: Record<string, unknown>): VehicleMpgProfile | null {
  const fuelType = String(data.fuelType1 ?? data.fuelType ?? "Regular");
  const isElectric =
    /electric/i.test(fuelType) ||
    Number(data.combE) > 0 ||
    /electric/i.test(String(data.atvType ?? ""));

  if (isElectric) {
    const kwhPer100 = Number(data.combE) || Number(data.cityE) || 0;
    if (kwhPer100 > 0) {
      const mpge = Math.round((kwhPer100 > 0 ? 337 / kwhPer100 : 0) * 10) / 10;
      return {
        combMpg: mpge || 100,
        cityMpg: Number(data.cityE) || mpge,
        highwayMpg: Number(data.highwayE) || mpge,
        fuelType: "Electric",
        epaVehicleId: String(data.id ?? ""),
        drive: String(data.drive ?? ""),
      };
    }
  }

  const comb = Number(data.comb08 ?? data.comb08U ?? 0);
  if (!Number.isFinite(comb) || comb <= 0) return null;

  return {
    combMpg: Math.round(comb * 10) / 10,
    cityMpg: Math.round(Number(data.city08 ?? comb) * 10) / 10,
    highwayMpg: Math.round(Number(data.highway08 ?? comb) * 10) / 10,
    fuelType,
    epaVehicleId: String(data.id ?? ""),
    drive: String(data.drive ?? ""),
  };
}

export async function lookupVehicleMpg(
  year: string,
  make: string,
  model: string,
  trim?: string
): Promise<VehicleMpgProfile | null> {
  if (!year || !make?.trim() || !model?.trim()) return null;

  const makes = await epaGet<{ menuItem?: EpaMenuItem[] }>(
    `/vehicle/menu/make?year=${encodeURIComponent(year)}`
  );
  const makeItem = bestMenuMatch(make, makes?.menuItem ?? []);
  if (!makeItem) return null;

  const models = await epaGet<{ menuItem?: EpaMenuItem[] }>(
    `/vehicle/menu/model?year=${encodeURIComponent(year)}&make=${encodeURIComponent(makeItem.value)}`
  );
  const modelItem = bestMenuMatch(model, models?.menuItem ?? []);
  if (!modelItem) return null;

  const options = await epaGet<{ menuItem?: EpaMenuItem[] }>(
    `/vehicle/menu/options?year=${encodeURIComponent(year)}&make=${encodeURIComponent(makeItem.value)}&model=${encodeURIComponent(modelItem.value)}`
  );
  const option = pickVehicleOption(options?.menuItem ?? [], trim);
  if (!option) return null;

  const vehicle = await epaGet<Record<string, unknown>>(`/vehicle/${option.value}`);
  if (!vehicle) return null;

  return parseMpgRecord(vehicle);
}

export async function enrichVehicleMpg(vehicle: VehicleInfo): Promise<VehicleInfo> {
  if (vehicle.combMpg && vehicle.combMpg > 0) return vehicle;
  const mpg = await lookupVehicleMpg(vehicle.year, vehicle.make, vehicle.model, vehicle.trim);
  if (!mpg) return vehicle;
  return {
    ...vehicle,
    combMpg: mpg.combMpg,
    cityMpg: mpg.cityMpg,
    highwayMpg: mpg.highwayMpg,
    fuelType: mpg.fuelType,
  };
}

export function effectiveFuelMiles(distanceMiles: number): number {
  return Math.max(1, distanceMiles - 4);
}

/** Highway-heavy move blend: 70% highway / 30% city from EPA ratings. */
export function blendedMpg(cityMpg: number, highwayMpg: number): number {
  const city = Math.max(1, cityMpg);
  const highway = Math.max(1, highwayMpg);
  return Math.round((0.3 / city + 0.7 / highway) ** -1 * 10) / 10;
}

export function mpgForVehicle(vehicle: VehicleInfo): number {
  if (vehicle.combMpg && vehicle.combMpg > 0) {
    if (vehicle.cityMpg && vehicle.highwayMpg) {
      return blendedMpg(vehicle.cityMpg, vehicle.highwayMpg);
    }
    return vehicle.combMpg;
  }
  return 26;
}
