import type { DestinationUtilityProvider } from "@/lib/types";
import { resolveZipFromQuery } from "@/lib/geo/resolve-zip";

const USER_AGENT = "MovePilotAI/1.0 (moving dashboard; contact@movepilot.ai)";

interface LocationContext {
  zip: string | null;
  state: string | null;
  city: string | null;
  lat: number;
  lon: number;
  label: string;
}

const PROVIDER_WEBSITES: Record<string, string> = {
  "appalachian power": "https://www.appalachianpower.com",
  "aep": "https://www.appalachianpower.com",
  "atmos energy": "https://www.atmosenergy.com",
  "mountaineer gas": "https://www.mountaineergas.com",
  "frontier": "https://frontier.com",
  "xfinity": "https://www.xfinity.com",
  "spectrum": "https://www.spectrum.com",
  "att": "https://www.att.com",
  "verizon": "https://www.verizon.com",
  "pg&e": "https://www.pge.com",
  "fpl": "https://www.fpl.com",
  "con edison": "https://www.coned.com",
};

function lookupProviderWebsite(name: string): string | undefined {
  const lower = name.toLowerCase();
  for (const [key, url] of Object.entries(PROVIDER_WEBSITES)) {
    if (lower.includes(key)) return url;
  }
  return undefined;
}

const STATE_UTILITIES: Record<
  string,
  { electricity: string; water: string; gas: string }
> = {
  TX: {
    electricity: "Local TDSP / retail electric provider",
    water: "Municipal water utility",
    gas: "Atmos Energy or local gas utility",
  },
  WV: {
    electricity: "Appalachian Power (AEP)",
    water: "Municipal water & sewer",
    gas: "Mountaineer Gas Company",
  },
  CA: {
    electricity: "PG&E / SCE / SDG&E (by region)",
    water: "City water district",
    gas: "SoCalGas / regional provider",
  },
  FL: {
    electricity: "FPL / Duke Energy (by region)",
    water: "County water utility",
    gas: "Florida City Gas / regional provider",
  },
  NY: {
    electricity: "Con Edison / NYSEG (by region)",
    water: "NYC DEP / local water authority",
    gas: "National Grid / Con Edison",
  },
};

interface FccProvider {
  provider_name?: string;
  brand_name?: string;
  technology?: string;
  maxdown?: number;
}

async function reverseLocation(lat: number, lon: number): Promise<LocationContext> {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lon));
  url.searchParams.set("format", "json");
  url.searchParams.set("addressdetails", "1");

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
    next: { revalidate: 86400 },
  });

  if (!res.ok) {
    return { zip: null, state: null, city: null, lat, lon, label: `${lat}, ${lon}` };
  }

  const data = (await res.json()) as {
    display_name?: string;
    address?: { postcode?: string; state?: string; city?: string; town?: string };
  };
  const zip = data.address?.postcode?.match(/\d{5}/)?.[0] ?? null;
  const iso = (data.address as { "ISO3166-2-lvl4"?: string } | undefined)?.["ISO3166-2-lvl4"];
  const state = iso?.startsWith("US-") ? iso.slice(3) : null;
  const city = data.address?.city ?? data.address?.town ?? null;

  return {
    zip,
    state,
    city,
    lat,
    lon,
    label: data.display_name ?? `${lat}, ${lon}`,
  };
}

async function fetchFccBroadband(lat: number, lon: number): Promise<FccProvider[]> {
  try {
    const url = new URL("https://broadbandmap.fcc.gov/nbm/map/api/getProviders");
    url.searchParams.set("latitude", String(lat));
    url.searchParams.set("longitude", String(lon));

    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      next: { revalidate: 86400 },
    });
    if (!res.ok) return [];

    const data = (await res.json()) as FccProvider[] | { providers?: FccProvider[] };
    if (Array.isArray(data)) return data;
    return data.providers ?? [];
  } catch {
    return [];
  }
}

function mapTechnologyCategory(tech?: string): "fiber" | "internet" | "cable" {
  const t = (tech ?? "").toLowerCase();
  if (t.includes("fiber")) return "fiber";
  if (t.includes("cable")) return "cable";
  return "internet";
}

function buildBroadbandProviders(fcc: FccProvider[], location: LocationContext): DestinationUtilityProvider[] {
  const seen = new Set<string>();
  const providers: DestinationUtilityProvider[] = [];
  let bestFiberSet = false;

  for (const row of fcc) {
    const name = row.brand_name || row.provider_name;
    if (!name || seen.has(name)) continue;
    seen.add(name);

    const category = mapTechnologyCategory(row.technology);
    const down = row.maxdown ? `${Math.round(row.maxdown)} Mbps down` : undefined;
    const isFiber = category === "fiber" && !bestFiberSet;
    if (isFiber) bestFiberSet = true;

    providers.push({
      id: `bb-${seen.size}`,
      name,
      websiteUrl: lookupProviderWebsite(name),
      category,
      categoryLabel:
        category === "fiber" ? "Fiber internet" : category === "cable" ? "Cable internet" : "Internet",
      rank: category === "fiber" ? 1 : 2,
      isBestPick: isFiber,
      availableAtAddress: true,
      estimatedMonthlyPrice: category === "fiber" ? 59.99 : category === "cable" ? 49.99 : 39.99,
      priceUnit: "/mo est.",
      speedOrCapacity: down,
      rating: 4.2,
      coverageNote: `FCC broadband data for ZIP ${location.zip ?? "area"}`,
      pros: ["Reported at this location", "Compare plans before signing"],
      cons: ["Prices are estimates — confirm with provider"],
    });
  }

  return providers.slice(0, 8);
}

function buildStateUtilities(location: LocationContext): DestinationUtilityProvider[] {
  const stateKey = location.state ?? "";
  const defaults = STATE_UTILITIES[stateKey] ?? {
    electricity: "Regional electric utility",
    water: "Municipal water & sewer",
    gas: "Local natural gas provider",
  };

  const short = location.city ?? location.zip ?? "your area";

  return [
    {
      id: "elec-regional",
      name: defaults.electricity,
      websiteUrl: lookupProviderWebsite(defaults.electricity),
      category: "electricity",
      categoryLabel: "Electricity",
      rank: 1,
      isBestPick: true,
      availableAtAddress: true,
      estimatedMonthlyPrice: 95,
      priceUnit: "/mo avg.",
      speedOrCapacity: "~800 kWh/month est.",
      rating: 4.1,
      coverageNote: `Typical provider for ${short}, ${stateKey || "US"}`,
      pros: ["Required utility", "Start service before move-in"],
      cons: ["Rates vary by usage and season"],
      setupFee: 0,
    },
    {
      id: "water-muni",
      name: defaults.water,
      websiteUrl: lookupProviderWebsite(defaults.water),
      category: "water",
      categoryLabel: "Water & sewer",
      rank: 1,
      isBestPick: true,
      availableAtAddress: true,
      estimatedMonthlyPrice: 45,
      priceUnit: "/mo avg.",
      rating: 4.2,
      coverageNote: `City/county water for ${short}`,
      pros: ["Usually single local provider", "Online transfer available"],
      cons: ["Limited provider choice"],
      setupFee: 15,
    },
    {
      id: "gas-local",
      name: defaults.gas,
      websiteUrl: lookupProviderWebsite(defaults.gas),
      category: "gas",
      categoryLabel: "Natural gas",
      rank: 1,
      isBestPick: true,
      availableAtAddress: true,
      estimatedMonthlyPrice: 40,
      priceUnit: "/mo avg.",
      rating: 4.0,
      coverageNote: `Gas service near ${short}`,
      pros: ["Schedule setup ahead of move"],
      cons: ["Not all buildings have gas"],
      setupFee: 0,
    },
  ];
}

export async function fetchUtilitiesForLocation(input: {
  lat?: number;
  lon?: number;
  address?: string;
}): Promise<{ providers: DestinationUtilityProvider[]; location: LocationContext; summary: string }> {
  let lat = input.lat;
  let lon = input.lon;
  let location: LocationContext;

  if (lat != null && lon != null && Number.isFinite(lat) && Number.isFinite(lon)) {
    location = await reverseLocation(lat, lon);
  } else if (input.address?.trim()) {
    const url = new URL("https://nominatim.openstreetmap.org/search");
    url.searchParams.set("q", input.address.trim());
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "1");
    url.searchParams.set("countrycodes", "us");
    const res = await fetch(url.toString(), {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      next: { revalidate: 86400 },
    });
    const data = (await res.json()) as { lat?: string; lon?: string }[];
    const first = data[0];
    lat = first?.lat ? parseFloat(first.lat) : undefined;
    lon = first?.lon ? parseFloat(first.lon) : undefined;
    const zip = await resolveZipFromQuery(input.address);
    location =
      lat != null && lon != null
        ? await reverseLocation(lat, lon)
        : { zip, state: null, city: null, lat: 0, lon: 0, label: input.address };
  } else {
    throw new Error("Address or coordinates required");
  }

  if (lat == null || lon == null) {
    throw new Error("Could not geocode address");
  }

  const fcc = await fetchFccBroadband(lat, lon);
  const broadband = buildBroadbandProviders(fcc, location);
  const utilities = buildStateUtilities(location);
  const providers = [...utilities, ...broadband];

  const bestFiber = broadband.find((p) => p.category === "fiber");
  const summary = bestFiber
    ? `Fiber available (${bestFiber.name}) near ${location.label.split(",").slice(0, 2).join(",")}. Confirm exact unit service before ordering.`
    : `Utilities for ${location.label.split(",").slice(0, 2).join(",")}. Internet from FCC data; confirm electricity, water, and gas locally.`;

  return { providers, location, summary };
}
