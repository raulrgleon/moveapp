import type { Locale } from "@/lib/i18n";

export interface PartnerDirectoryEntry {
  id: string;
  name: string;
  regions: string[];
  usdot?: string;
  rating?: number;
  yearsInBusiness?: number;
  specialties: string[];
  website?: string;
}

/** Curated starter directory — expand as real partners onboard. */
export const PARTNER_DIRECTORY: PartnerDirectoryEntry[] = [
  {
    id: "two-men-national",
    name: "Two Men and a Truck (network)",
    regions: ["Nationwide", "US"],
    usdot: "2548634",
    rating: 4.6,
    yearsInBusiness: 38,
    specialties: ["local", "long_distance", "packing"],
    website: "https://twomenandatruck.com",
  },
  {
    id: "uhaul-partners",
    name: "U-Haul MovingHelp",
    regions: ["Nationwide", "US"],
    rating: 4.3,
    yearsInBusiness: 20,
    specialties: ["labor", "loading", "local"],
    website: "https://www.uhaul.com/MovingHelp",
  },
  {
    id: "pods-partners",
    name: "PODS Preferred Movers",
    regions: ["Nationwide", "US"],
    rating: 4.4,
    yearsInBusiness: 25,
    specialties: ["container", "long_distance", "storage"],
    website: "https://www.pods.com",
  },
  {
    id: "regional-long-distance",
    name: "Regional long-distance movers",
    regions: ["Cross-state", "US"],
    rating: 4.2,
    yearsInBusiness: 15,
    specialties: ["long_distance", "full_service"],
  },
];

export function partnersForRoute(origin: string, destination: string): PartnerDirectoryEntry[] {
  const isLongDistance =
    origin.split(",")[1]?.trim().toLowerCase() !== destination.split(",")[1]?.trim().toLowerCase();

  return PARTNER_DIRECTORY.filter((entry) => {
    if (isLongDistance) {
      return entry.specialties.includes("long_distance") || entry.regions.includes("Nationwide");
    }
    return entry.specialties.includes("local") || entry.regions.includes("Nationwide");
  }).slice(0, 4);
}

/** @deprecated Use listActivePartnersForRoute from partner-store */
export function partnersForRouteSync(origin: string, destination: string): PartnerDirectoryEntry[] {
  return partnersForRoute(origin, destination);
}

export function specialtyLabel(key: string, locale: Locale): string {
  const labels: Record<string, { en: string; es: string }> = {
    local: { en: "Local", es: "Local" },
    long_distance: { en: "Long distance", es: "Larga distancia" },
    packing: { en: "Packing", es: "Embalaje" },
    labor: { en: "Labor", es: "Mano de obra" },
    loading: { en: "Loading", es: "Carga" },
    container: { en: "Container", es: "Contenedor" },
    storage: { en: "Storage", es: "Almacenaje" },
    full_service: { en: "Full service", es: "Servicio completo" },
  };
  return labels[key]?.[locale] ?? key;
}
