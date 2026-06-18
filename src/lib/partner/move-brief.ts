import type { Locale } from "@/lib/i18n";
import { parseRentalPreferenceKey, rentalPreferenceFromKey } from "@/lib/move-profile";
import type { VehicleInfo } from "@/lib/vehicles/types";

export type MoveComplexityLevel = "simple" | "moderate" | "complex";

export interface MoveBriefInput {
  origin: string;
  destination: string;
  moveDate: string;
  household: string;
  pets: boolean;
  rentalPreference: string;
  distanceMiles?: number;
  durationHours?: number;
  boxCount: number;
  estWeightLbs: number;
  fragileCount: number;
  vehicleCount: number;
  drivingVehicleCount: number;
  vehicles?: VehicleInfo[];
  budgetEstimate: number;
  diyEstimate?: number;
  fuelEstimate?: number;
  pendingTasks?: number;
}

export interface MoveBrief extends MoveBriefInput {
  complexity: MoveComplexityLevel;
  complexityScore: number;
  rentalPreferenceKey: ReturnType<typeof parseRentalPreferenceKey>;
  rentalPreferenceLabel: string;
}

export const PARTNER_QUOTE_STATUSES = [
  "pending",
  "negotiating",
  "accepted",
  "declined",
  "hired",
  "completed",
] as const;

export type PartnerQuoteStatus = (typeof PARTNER_QUOTE_STATUSES)[number];

export const PARTNER_SERVICE_TYPES = [
  "full_service",
  "labor_only",
  "load_unload",
  "partial",
] as const;

export type PartnerServiceType = (typeof PARTNER_SERVICE_TYPES)[number];

export function isValidPartnerQuoteStatus(status: string): status is PartnerQuoteStatus {
  return (PARTNER_QUOTE_STATUSES as readonly string[]).includes(status);
}

export function computeMoveComplexity(input: {
  distanceMiles?: number;
  boxCount: number;
  estWeightLbs: number;
  fragileCount: number;
  pets: boolean;
  vehicleCount: number;
  household: string;
}): { level: MoveComplexityLevel; score: number } {
  let score = 0;
  const miles = input.distanceMiles ?? 0;

  if (miles >= 1500) score += 3;
  else if (miles >= 800) score += 2;
  else if (miles >= 400) score += 1;

  if (input.boxCount >= 40) score += 3;
  else if (input.boxCount >= 20) score += 2;
  else if (input.boxCount >= 10) score += 1;

  if (input.estWeightLbs >= 8000) score += 2;
  else if (input.estWeightLbs >= 4000) score += 1;

  if (input.fragileCount >= 5) score += 2;
  else if (input.fragileCount >= 1) score += 1;

  if (input.pets) score += 1;
  if (input.vehicleCount >= 3) score += 2;
  else if (input.vehicleCount >= 2) score += 1;

  const household = input.household.toLowerCase();
  if (/4\+|5|large|grande|familia/i.test(household)) score += 2;
  else if (/3|three|tres/i.test(household)) score += 1;

  let level: MoveComplexityLevel = "simple";
  if (score >= 8) level = "complex";
  else if (score >= 4) level = "moderate";

  return { level, score };
}

export function buildMoveBrief(input: MoveBriefInput): MoveBrief {
  const rentalPreferenceKey = parseRentalPreferenceKey(input.rentalPreference);
  const { level, score } = computeMoveComplexity(input);

  return {
    ...input,
    rentalPreferenceKey,
    rentalPreferenceLabel: rentalPreferenceFromKey(rentalPreferenceKey),
    complexity: level,
    complexityScore: score,
  };
}

export function complexityLabel(level: MoveComplexityLevel, locale: Locale): string {
  const labels: Record<MoveComplexityLevel, { en: string; es: string }> = {
    simple: { en: "Simple move", es: "Mudanza simple" },
    moderate: { en: "Moderate move", es: "Mudanza media" },
    complex: { en: "Complex move", es: "Mudanza compleja" },
  };
  return labels[level][locale];
}

export function serviceTypeLabel(type: string | null | undefined, locale: Locale): string {
  const labels: Record<PartnerServiceType, { en: string; es: string }> = {
    full_service: { en: "Full service", es: "Servicio completo" },
    labor_only: { en: "Labor only", es: "Solo mano de obra" },
    load_unload: { en: "Load & unload", es: "Carga y descarga" },
    partial: { en: "Partial move", es: "Mudanza parcial" },
  };
  if (!type || !(type in labels)) {
    return locale === "es" ? "No especificado" : "Not specified";
  }
  return labels[type as PartnerServiceType][locale];
}

export function estimateInventoryWeightLbs(
  boxes: { weightLbs?: number | null; sizeEstimate?: string | null }[]
): number {
  return boxes.reduce((sum, box) => {
    const w =
      box.weightLbs ??
      (box.sizeEstimate === "s" ? 25 : box.sizeEstimate === "l" ? 70 : 45);
    return sum + w;
  }, 0);
}
