import type { VehicleInfo } from "./types";

const EPA_BASE = "https://www.fueleconomy.gov/ws/rest";

/** Official EPA fueleconomy.gov fuel economy profile. */
export interface VehicleMpgProfile {
  combMpg: number;
  cityMpg: number;
  highwayMpg: number;
  fuelType: string;
  epaVehicleId?: string;
  drive?: string;
  optionText?: string;
  cylinders?: number;
  displ?: number;
}

export interface EpaVehicleOption {
  id: string;
  text: string;
}

type EpaMenuItem = { text: string; value: string };

/** Common NHTSA / UI make names → EPA menu names. */
const MAKE_ALIASES: Record<string, string[]> = {
  chevrolet: ["chevrolet", "chevy"],
  chevy: ["chevrolet", "chevy"],
  mercedesbenz: ["mercedesbenz", "mercedes-benz", "mercedes"],
  "mercedes-benz": ["mercedesbenz", "mercedes-benz", "mercedes"],
  volkswagen: ["volkswagen", "vw"],
  vw: ["volkswagen", "vw"],
  ram: ["ram", "dodge"],
  landrover: ["landrover", "land rover"],
  "land rover": ["landrover", "land rover"],
  bmw: ["bmw"],
  gmc: ["gmc"],
  kia: ["kia"],
  hyundai: ["hyundai"],
  toyota: ["toyota"],
  honda: ["honda"],
  ford: ["ford"],
  nissan: ["nissan"],
  jeep: ["jeep"],
  subaru: ["subaru"],
  mazda: ["mazda"],
  tesla: ["tesla"],
  dodge: ["dodge", "ram"],
  lexus: ["lexus"],
  audi: ["audi"],
  porsche: ["porsche"],
  volvo: ["volvo"],
  acura: ["acura"],
  infiniti: ["infiniti", "infinity"],
  infinity: ["infiniti", "infinity"],
  lincoln: ["lincoln"],
  buick: ["buick"],
  cadillac: ["cadillac"],
  chrysler: ["chrysler"],
  mini: ["mini", "minicooper"],
  fiat: ["fiat"],
  mitsubishi: ["mitsubishi"],
  genesis: ["genesis"],
  rivian: ["rivian"],
  lucid: ["lucid"],
  polestar: ["polestar"],
};

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

function asMenuItems(payload: { menuItem?: EpaMenuItem | EpaMenuItem[] } | null): EpaMenuItem[] {
  const raw = payload?.menuItem;
  if (!raw) return [];
  return Array.isArray(raw) ? raw : [raw];
}

function normalizeToken(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function aliasKeysFor(query: string): string[] {
  const n = normalizeToken(query);
  const aliases = MAKE_ALIASES[n];
  if (aliases?.length) return aliases.map(normalizeToken);
  return [n];
}

/**
 * Match EPA menu item. Never silently picks items[0] for make/model —
 * that was attaching unrelated MPG to the wrong vehicle.
 */
function bestMenuMatch(
  query: string,
  items: EpaMenuItem[],
  opts?: { allowWeakFallback?: boolean }
): EpaMenuItem | null {
  if (!items.length || !query.trim()) return null;

  const candidates = aliasKeysFor(query);

  const exact = items.find((i) => {
    const t = normalizeToken(i.text);
    const v = normalizeToken(i.value);
    return candidates.some((q) => t === q || v === q);
  });
  if (exact) return exact;

  const startsWith = items.filter((i) => {
    const t = normalizeToken(i.text);
    return candidates.some((q) => t.startsWith(q) || q.startsWith(t));
  });
  if (startsWith.length === 1) return startsWith[0];
  if (startsWith.length > 1) {
    return startsWith.sort((a, b) => a.text.length - b.text.length)[0];
  }

  const contains = items.filter((i) => {
    const t = normalizeToken(i.text);
    return candidates.some((q) => (q.length >= 3 && t.includes(q)) || (t.length >= 3 && q.includes(t)));
  });
  if (contains.length === 1) return contains[0];
  if (contains.length > 1) {
    // Prefer shortest text that still contains the query (more specific model names)
    return contains.sort((a, b) => a.text.length - b.text.length)[0];
  }

  if (opts?.allowWeakFallback) return items[0];
  return null;
}

function scoreOption(optionText: string, trim?: string): number {
  const text = optionText.toLowerCase();
  let score = 0;

  if (trim?.trim()) {
    const tokens = trim
      .toLowerCase()
      .split(/[\s/,|-]+/)
      .map((t) => t.trim())
      .filter((t) => t.length >= 2);
    for (const token of tokens) {
      if (text.includes(token)) score += 10;
    }
  }

  // Prefer automatic / common consumer configs when no trim
  if (/auto|cvt|variable/i.test(text)) score += 2;
  if (/manual|amt/i.test(text)) score -= 1;
  // Prefer more common 2WD/FWD over 4WD when unspecified (usually better MPG match intent)
  if (!trim?.trim()) {
    if (/\b(fwd|2wd|rwd)\b/i.test(text)) score += 1;
  }

  return score;
}

function pickVehicleOption(options: EpaMenuItem[], trim?: string): EpaMenuItem | null {
  if (!options.length) return null;

  const ranked = [...options].sort((a, b) => scoreOption(b.text, trim) - scoreOption(a.text, trim));
  const best = ranked[0];
  const bestScore = scoreOption(best.text, trim);

  // If user typed a trim and nothing scored, don't pretend we matched it
  if (trim?.trim() && bestScore < 10) {
    // Still return best auto option rather than failing entirely — UI should show options
    const auto = options.find((o) => /auto|cvt|variable/i.test(o.text));
    return auto ?? options[0];
  }

  return best;
}

/** EPA: 1 gal gasoline ≈ 33.7 kWh → MPGe = 3370 / (kWh/100mi). */
function kwhToMpge(kwhPer100: number): number {
  if (!Number.isFinite(kwhPer100) || kwhPer100 <= 0) return 0;
  return Math.round((3370 / kwhPer100) * 10) / 10;
}

/**
 * EPA lab ratings are optimistic vs real-world driving.
 * Subtract a flat buffer so fuel estimates stay conservative.
 */
const REAL_WORLD_MPG_OFFSET = 3;

function applyRealWorldMpg(mpg: number): number {
  if (!Number.isFinite(mpg) || mpg <= 0) return mpg;
  return Math.max(1, Math.round((mpg - REAL_WORLD_MPG_OFFSET) * 10) / 10);
}

function parseMpgRecord(data: Record<string, unknown>, optionText?: string): VehicleMpgProfile | null {
  const fuelType = String(data.fuelType1 ?? data.fuelType ?? "Regular");
  const isElectric =
    /electric/i.test(fuelType) ||
    Number(data.combE) > 0 ||
    /electric/i.test(String(data.atvType ?? ""));

  if (isElectric) {
    // EPA already publishes MPGe in city08/highway08/comb08 for EVs.
    const comb08 = Number(data.comb08 ?? data.comb08U ?? 0);
    const city08 = Number(data.city08 ?? data.city08U ?? 0);
    const highway08 = Number(data.highway08 ?? data.highway08U ?? 0);
    const combE = Number(data.combE) || 0;
    const cityE = Number(data.cityE) || combE;
    const highwayE = Number(data.highwayE) || combE;
    const combMpge =
      (comb08 > 0 ? Math.round(comb08 * 10) / 10 : 0) ||
      kwhToMpge(combE) ||
      kwhToMpge(cityE);
    if (combMpge <= 0) return null;

    const city =
      (city08 > 0 ? Math.round(city08 * 10) / 10 : 0) ||
      kwhToMpge(cityE) ||
      combMpge;
    const highway =
      (highway08 > 0 ? Math.round(highway08 * 10) / 10 : 0) ||
      kwhToMpge(highwayE) ||
      combMpge;

    return {
      combMpg: applyRealWorldMpg(combMpge),
      cityMpg: applyRealWorldMpg(city),
      highwayMpg: applyRealWorldMpg(highway),
      fuelType: "Electric",
      epaVehicleId: String(data.id ?? ""),
      drive: String(data.drive ?? ""),
      optionText,
      cylinders: Number(data.cylinders) || undefined,
      displ: Number(data.displ) || undefined,
    };
  }

  const comb = Number(data.comb08 ?? data.comb08U ?? 0);
  if (!Number.isFinite(comb) || comb <= 0) return null;

  return {
    combMpg: applyRealWorldMpg(Math.round(comb * 10) / 10),
    cityMpg: applyRealWorldMpg(Math.round(Number(data.city08 ?? comb) * 10) / 10),
    highwayMpg: applyRealWorldMpg(Math.round(Number(data.highway08 ?? comb) * 10) / 10),
    fuelType,
    epaVehicleId: String(data.id ?? ""),
    drive: String(data.drive ?? ""),
    optionText,
    cylinders: Number(data.cylinders) || undefined,
    displ: Number(data.displ) || undefined,
  };
}

/** Resolve EPA make + model menu values for a NHTSA/UI vehicle. */
async function resolveEpaMakeModel(
  year: string,
  make: string,
  model: string
): Promise<{ makeValue: string; modelValue: string } | null> {
  const makes = asMenuItems(
    await epaGet<{ menuItem?: EpaMenuItem | EpaMenuItem[] }>(
      `/vehicle/menu/make?year=${encodeURIComponent(year)}`
    )
  );
  const makeItem = bestMenuMatch(make, makes);
  if (!makeItem) return null;

  const models = asMenuItems(
    await epaGet<{ menuItem?: EpaMenuItem | EpaMenuItem[] }>(
      `/vehicle/menu/model?year=${encodeURIComponent(year)}&make=${encodeURIComponent(makeItem.value)}`
    )
  );
  const modelItem = bestMenuMatch(model, models);
  if (!modelItem) return null;

  return { makeValue: makeItem.value, modelValue: modelItem.value };
}

/** List exact EPA configurations (engine / drive / transmission) for a vehicle. */
export async function listEpaVehicleOptions(
  year: string,
  make: string,
  model: string
): Promise<EpaVehicleOption[]> {
  if (!year || !make?.trim() || !model?.trim()) return [];

  const resolved = await resolveEpaMakeModel(year, make, model);
  if (!resolved) return [];

  const options = asMenuItems(
    await epaGet<{ menuItem?: EpaMenuItem | EpaMenuItem[] }>(
      `/vehicle/menu/options?year=${encodeURIComponent(year)}&make=${encodeURIComponent(resolved.makeValue)}&model=${encodeURIComponent(resolved.modelValue)}`
    )
  );

  return options.map((o) => ({ id: o.value, text: o.text }));
}

/** Lookup MPG by exact EPA vehicle id (most accurate). */
export async function lookupVehicleMpgByEpaId(
  epaVehicleId: string
): Promise<VehicleMpgProfile | null> {
  const id = epaVehicleId.trim();
  if (!id) return null;
  const vehicle = await epaGet<Record<string, unknown>>(`/vehicle/${encodeURIComponent(id)}`);
  if (!vehicle) return null;
  return parseMpgRecord(vehicle);
}

/**
 * Lookup EPA MPG for year/make/model[/trim].
 * Uses fueleconomy.gov — same data as fueleconomy.gov / EPA labels on new cars.
 */
export async function lookupVehicleMpg(
  year: string,
  make: string,
  model: string,
  trim?: string,
  epaVehicleId?: string
): Promise<VehicleMpgProfile | null> {
  if (epaVehicleId?.trim()) {
    const byId = await lookupVehicleMpgByEpaId(epaVehicleId);
    if (byId) return byId;
  }

  if (!year || !make?.trim() || !model?.trim()) return null;

  const resolved = await resolveEpaMakeModel(year, make, model);
  if (!resolved) return null;

  const options = asMenuItems(
    await epaGet<{ menuItem?: EpaMenuItem | EpaMenuItem[] }>(
      `/vehicle/menu/options?year=${encodeURIComponent(year)}&make=${encodeURIComponent(resolved.makeValue)}&model=${encodeURIComponent(resolved.modelValue)}`
    )
  );
  const option = pickVehicleOption(options, trim);
  if (!option) return null;

  const vehicle = await epaGet<Record<string, unknown>>(`/vehicle/${option.value}`);
  if (!vehicle) return null;

  return parseMpgRecord(vehicle, option.text);
}

export async function enrichVehicleMpg(
  vehicle: VehicleInfo,
  opts?: { force?: boolean }
): Promise<VehicleInfo> {
  if (!opts?.force && vehicle.combMpg && vehicle.combMpg > 0) {
    return vehicle;
  }

  const mpg = await lookupVehicleMpg(
    vehicle.year,
    vehicle.make,
    vehicle.model,
    vehicle.trim,
    vehicle.epaVehicleId
  );
  if (!mpg) return vehicle;

  return {
    ...vehicle,
    combMpg: mpg.combMpg,
    cityMpg: mpg.cityMpg,
    highwayMpg: mpg.highwayMpg,
    fuelType: mpg.fuelType,
    epaVehicleId: mpg.epaVehicleId || vehicle.epaVehicleId,
    trim: vehicle.trim || mpg.optionText || undefined,
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
  // Electric: use combined MPGe only — city/highway are already MPGe after parse fix
  if (vehicle.fuelType && /electric/i.test(vehicle.fuelType)) {
    return vehicle.combMpg && vehicle.combMpg > 0 ? vehicle.combMpg : 100;
  }

  if (vehicle.combMpg && vehicle.combMpg > 0) {
    if (vehicle.cityMpg && vehicle.highwayMpg) {
      // Guard against legacy bad EV data (kWh mistaken as MPG → tiny numbers)
      if (vehicle.cityMpg < 5 || vehicle.highwayMpg < 5) return vehicle.combMpg;
      return blendedMpg(vehicle.cityMpg, vehicle.highwayMpg);
    }
    return vehicle.combMpg;
  }
  return 26;
}
