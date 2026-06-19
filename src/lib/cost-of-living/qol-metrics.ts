import { compareValues } from "@/lib/comparison/trend";
import { normalizeUsState } from "@/lib/geo/address-region";
import type { ResolvedLocation } from "@/lib/geo/resolve-location";
import type { ComparisonDirection, HousingTrend } from "@/lib/rentcast/types";

/** Relative indices vs U.S. average = 100 (approximate public data, rounded). */
export interface StateQoLProfile {
  costOfLivingIndex: number;
  crimeIndex: number;
  avgAnnualSalary: number;
  unemploymentPct: number;
  stateIncomeTaxPct: number;
  avgSalesTaxPct: number;
  schoolRating: number;
  avgHighF: number;
  avgLowF: number;
  walkScore: number;
}

export const STATE_QOL: Record<string, StateQoLProfile> = {
  Alabama: { costOfLivingIndex: 88, crimeIndex: 118, avgAnnualSalary: 52000, unemploymentPct: 3.2, stateIncomeTaxPct: 5, avgSalesTaxPct: 9.2, schoolRating: 6.2, avgHighF: 72, avgLowF: 51, walkScore: 28 },
  Alaska: { costOfLivingIndex: 125, crimeIndex: 132, avgAnnualSalary: 68000, unemploymentPct: 4.5, stateIncomeTaxPct: 0, avgSalesTaxPct: 1.8, schoolRating: 6.8, avgHighF: 44, avgLowF: 28, walkScore: 32 },
  Arizona: { costOfLivingIndex: 103, crimeIndex: 108, avgAnnualSalary: 58000, unemploymentPct: 3.8, stateIncomeTaxPct: 2.5, avgSalesTaxPct: 8.4, schoolRating: 6.5, avgHighF: 86, avgLowF: 60, walkScore: 35 },
  Arkansas: { costOfLivingIndex: 86, crimeIndex: 115, avgAnnualSalary: 48000, unemploymentPct: 3.4, stateIncomeTaxPct: 4.7, avgSalesTaxPct: 9.5, schoolRating: 6.0, avgHighF: 70, avgLowF: 48, walkScore: 26 },
  California: { costOfLivingIndex: 142, crimeIndex: 105, avgAnnualSalary: 78000, unemploymentPct: 4.8, stateIncomeTaxPct: 9.3, avgSalesTaxPct: 8.8, schoolRating: 7.2, avgHighF: 72, avgLowF: 50, walkScore: 52 },
  Colorado: { costOfLivingIndex: 112, crimeIndex: 98, avgAnnualSalary: 72000, unemploymentPct: 3.5, stateIncomeTaxPct: 4.4, avgSalesTaxPct: 7.8, schoolRating: 7.4, avgHighF: 63, avgLowF: 35, walkScore: 42 },
  Connecticut: { costOfLivingIndex: 118, crimeIndex: 88, avgAnnualSalary: 76000, unemploymentPct: 4.2, stateIncomeTaxPct: 6.99, avgSalesTaxPct: 6.4, schoolRating: 7.6, avgHighF: 58, avgLowF: 38, walkScore: 45 },
  Delaware: { costOfLivingIndex: 102, crimeIndex: 95, avgAnnualSalary: 62000, unemploymentPct: 4.0, stateIncomeTaxPct: 6.6, avgSalesTaxPct: 0, schoolRating: 6.8, avgHighF: 64, avgLowF: 44, walkScore: 34 },
  "District of Columbia": { costOfLivingIndex: 148, crimeIndex: 112, avgAnnualSalary: 92000, unemploymentPct: 5.2, stateIncomeTaxPct: 8.5, avgSalesTaxPct: 6.0, schoolRating: 6.5, avgHighF: 66, avgLowF: 48, walkScore: 78 },
  Florida: { costOfLivingIndex: 101, crimeIndex: 102, avgAnnualSalary: 56000, unemploymentPct: 3.3, stateIncomeTaxPct: 0, avgSalesTaxPct: 7.0, schoolRating: 6.4, avgHighF: 82, avgLowF: 62, walkScore: 38 },
  Georgia: { costOfLivingIndex: 92, crimeIndex: 104, avgAnnualSalary: 60000, unemploymentPct: 3.4, stateIncomeTaxPct: 5.5, avgSalesTaxPct: 7.4, schoolRating: 6.6, avgHighF: 74, avgLowF: 52, walkScore: 33 },
  Hawaii: { costOfLivingIndex: 168, crimeIndex: 92, avgAnnualSalary: 65000, unemploymentPct: 3.0, stateIncomeTaxPct: 11, avgSalesTaxPct: 4.5, schoolRating: 7.0, avgHighF: 84, avgLowF: 68, walkScore: 44 },
  Idaho: { costOfLivingIndex: 98, crimeIndex: 96, avgAnnualSalary: 54000, unemploymentPct: 3.1, stateIncomeTaxPct: 5.8, avgSalesTaxPct: 6.0, schoolRating: 6.7, avgHighF: 62, avgLowF: 36, walkScore: 30 },
  Illinois: { costOfLivingIndex: 94, crimeIndex: 106, avgAnnualSalary: 64000, unemploymentPct: 4.5, stateIncomeTaxPct: 4.95, avgSalesTaxPct: 8.8, schoolRating: 6.9, avgHighF: 60, avgLowF: 40, walkScore: 40 },
  Indiana: { costOfLivingIndex: 90, crimeIndex: 98, avgAnnualSalary: 55000, unemploymentPct: 3.5, stateIncomeTaxPct: 3.2, avgSalesTaxPct: 7.0, schoolRating: 6.5, avgHighF: 62, avgLowF: 42, walkScore: 29 },
  Iowa: { costOfLivingIndex: 89, crimeIndex: 88, avgAnnualSalary: 54000, unemploymentPct: 2.9, stateIncomeTaxPct: 6.4, avgSalesTaxPct: 6.9, schoolRating: 7.0, avgHighF: 58, avgLowF: 36, walkScore: 28 },
  Kansas: { costOfLivingIndex: 88, crimeIndex: 102, avgAnnualSalary: 53000, unemploymentPct: 3.0, stateIncomeTaxPct: 5.7, avgSalesTaxPct: 8.7, schoolRating: 6.6, avgHighF: 64, avgLowF: 42, walkScore: 27 },
  Kentucky: { costOfLivingIndex: 89, crimeIndex: 104, avgAnnualSalary: 50000, unemploymentPct: 4.0, stateIncomeTaxPct: 5, avgSalesTaxPct: 6.0, schoolRating: 6.3, avgHighF: 66, avgLowF: 44, walkScore: 26 },
  Louisiana: { costOfLivingIndex: 91, crimeIndex: 122, avgAnnualSalary: 51000, unemploymentPct: 4.2, stateIncomeTaxPct: 4.25, avgSalesTaxPct: 9.6, schoolRating: 5.8, avgHighF: 76, avgLowF: 56, walkScore: 30 },
  Maine: { costOfLivingIndex: 108, crimeIndex: 82, avgAnnualSalary: 56000, unemploymentPct: 3.2, stateIncomeTaxPct: 7.15, avgSalesTaxPct: 5.5, schoolRating: 7.1, avgHighF: 54, avgLowF: 32, walkScore: 32 },
  Maryland: { costOfLivingIndex: 115, crimeIndex: 96, avgAnnualSalary: 72000, unemploymentPct: 3.8, stateIncomeTaxPct: 5.75, avgSalesTaxPct: 6.0, schoolRating: 7.3, avgHighF: 64, avgLowF: 44, walkScore: 41 },
  Massachusetts: { costOfLivingIndex: 128, crimeIndex: 85, avgAnnualSalary: 82000, unemploymentPct: 3.6, stateIncomeTaxPct: 5, avgSalesTaxPct: 6.3, schoolRating: 7.8, avgHighF: 56, avgLowF: 36, walkScore: 55 },
  Michigan: { costOfLivingIndex: 92, crimeIndex: 100, avgAnnualSalary: 58000, unemploymentPct: 4.0, stateIncomeTaxPct: 4.25, avgSalesTaxPct: 6.0, schoolRating: 6.7, avgHighF: 58, avgLowF: 38, walkScore: 34 },
  Minnesota: { costOfLivingIndex: 98, crimeIndex: 90, avgAnnualSalary: 64000, unemploymentPct: 3.0, stateIncomeTaxPct: 9.85, avgSalesTaxPct: 7.5, schoolRating: 7.5, avgHighF: 52, avgLowF: 32, walkScore: 38 },
  Mississippi: { costOfLivingIndex: 84, crimeIndex: 120, avgAnnualSalary: 46000, unemploymentPct: 4.0, stateIncomeTaxPct: 5, avgSalesTaxPct: 7.1, schoolRating: 5.6, avgHighF: 74, avgLowF: 52, walkScore: 24 },
  Missouri: { costOfLivingIndex: 90, crimeIndex: 108, avgAnnualSalary: 54000, unemploymentPct: 3.3, stateIncomeTaxPct: 4.95, avgSalesTaxPct: 8.4, schoolRating: 6.4, avgHighF: 66, avgLowF: 44, walkScore: 31 },
  Montana: { costOfLivingIndex: 99, crimeIndex: 94, avgAnnualSalary: 54000, unemploymentPct: 3.2, stateIncomeTaxPct: 5.9, avgSalesTaxPct: 0, schoolRating: 6.9, avgHighF: 58, avgLowF: 32, walkScore: 29 },
  Nebraska: { costOfLivingIndex: 90, crimeIndex: 92, avgAnnualSalary: 54000, unemploymentPct: 2.8, stateIncomeTaxPct: 6.6, avgSalesTaxPct: 6.9, schoolRating: 7.0, avgHighF: 62, avgLowF: 38, walkScore: 28 },
  Nevada: { costOfLivingIndex: 102, crimeIndex: 110, avgAnnualSalary: 58000, unemploymentPct: 5.0, stateIncomeTaxPct: 0, avgSalesTaxPct: 8.2, schoolRating: 5.9, avgHighF: 78, avgLowF: 52, walkScore: 36 },
  "New Hampshire": { costOfLivingIndex: 112, crimeIndex: 78, avgAnnualSalary: 68000, unemploymentPct: 2.8, stateIncomeTaxPct: 0, avgSalesTaxPct: 0, schoolRating: 7.4, avgHighF: 56, avgLowF: 34, walkScore: 33 },
  "New Jersey": { costOfLivingIndex: 118, crimeIndex: 92, avgAnnualSalary: 78000, unemploymentPct: 4.2, stateIncomeTaxPct: 10.75, avgSalesTaxPct: 6.6, schoolRating: 7.5, avgHighF: 62, avgLowF: 42, walkScore: 48 },
  "New Mexico": { costOfLivingIndex: 94, crimeIndex: 114, avgAnnualSalary: 50000, unemploymentPct: 4.5, stateIncomeTaxPct: 5.9, avgSalesTaxPct: 7.6, schoolRating: 5.8, avgHighF: 68, avgLowF: 40, walkScore: 30 },
  "New York": { costOfLivingIndex: 125, crimeIndex: 88, avgAnnualSalary: 76000, unemploymentPct: 4.5, stateIncomeTaxPct: 8.8, avgSalesTaxPct: 8.5, schoolRating: 7.2, avgHighF: 58, avgLowF: 38, walkScore: 58 },
  "North Carolina": { costOfLivingIndex: 94, crimeIndex: 100, avgAnnualSalary: 58000, unemploymentPct: 3.4, stateIncomeTaxPct: 4.75, avgSalesTaxPct: 7.0, schoolRating: 6.7, avgHighF: 70, avgLowF: 48, walkScore: 32 },
  "North Dakota": { costOfLivingIndex: 95, crimeIndex: 86, avgAnnualSalary: 58000, unemploymentPct: 2.5, stateIncomeTaxPct: 2.9, avgSalesTaxPct: 7.0, schoolRating: 7.1, avgHighF: 52, avgLowF: 28, walkScore: 26 },
  Ohio: { costOfLivingIndex: 91, crimeIndex: 98, avgAnnualSalary: 56000, unemploymentPct: 4.0, stateIncomeTaxPct: 3.99, avgSalesTaxPct: 7.2, schoolRating: 6.6, avgHighF: 62, avgLowF: 42, walkScore: 33 },
  Oklahoma: { costOfLivingIndex: 87, crimeIndex: 112, avgAnnualSalary: 50000, unemploymentPct: 3.5, stateIncomeTaxPct: 4.75, avgSalesTaxPct: 8.9, schoolRating: 6.1, avgHighF: 72, avgLowF: 50, walkScore: 27 },
  Oregon: { costOfLivingIndex: 115, crimeIndex: 96, avgAnnualSalary: 64000, unemploymentPct: 4.2, stateIncomeTaxPct: 9.9, avgSalesTaxPct: 0, schoolRating: 6.8, avgHighF: 62, avgLowF: 42, walkScore: 40 },
  Pennsylvania: { costOfLivingIndex: 96, crimeIndex: 94, avgAnnualSalary: 62000, unemploymentPct: 3.8, stateIncomeTaxPct: 3.07, avgSalesTaxPct: 6.3, schoolRating: 6.9, avgHighF: 60, avgLowF: 40, walkScore: 38 },
  "Rhode Island": { costOfLivingIndex: 110, crimeIndex: 90, avgAnnualSalary: 64000, unemploymentPct: 4.0, stateIncomeTaxPct: 5.99, avgSalesTaxPct: 7.0, schoolRating: 6.8, avgHighF: 60, avgLowF: 40, walkScore: 42 },
  "South Carolina": { costOfLivingIndex: 93, crimeIndex: 108, avgAnnualSalary: 52000, unemploymentPct: 3.2, stateIncomeTaxPct: 6.4, avgSalesTaxPct: 7.4, schoolRating: 6.2, avgHighF: 74, avgLowF: 52, walkScore: 30 },
  "South Dakota": { costOfLivingIndex: 91, crimeIndex: 88, avgAnnualSalary: 52000, unemploymentPct: 2.6, stateIncomeTaxPct: 0, avgSalesTaxPct: 6.4, schoolRating: 6.9, avgHighF: 58, avgLowF: 32, walkScore: 26 },
  Tennessee: { costOfLivingIndex: 91, crimeIndex: 110, avgAnnualSalary: 54000, unemploymentPct: 3.3, stateIncomeTaxPct: 0, avgSalesTaxPct: 9.6, schoolRating: 6.3, avgHighF: 70, avgLowF: 48, walkScore: 28 },
  Texas: { costOfLivingIndex: 94, crimeIndex: 104, avgAnnualSalary: 62000, unemploymentPct: 4.0, stateIncomeTaxPct: 0, avgSalesTaxPct: 8.2, schoolRating: 6.5, avgHighF: 78, avgLowF: 56, walkScore: 34 },
  Utah: { costOfLivingIndex: 104, crimeIndex: 92, avgAnnualSalary: 62000, unemploymentPct: 3.0, stateIncomeTaxPct: 4.85, avgSalesTaxPct: 7.2, schoolRating: 7.2, avgHighF: 64, avgLowF: 38, walkScore: 36 },
  Vermont: { costOfLivingIndex: 112, crimeIndex: 80, avgAnnualSalary: 58000, unemploymentPct: 2.8, stateIncomeTaxPct: 6.6, avgSalesTaxPct: 6.2, schoolRating: 7.3, avgHighF: 54, avgLowF: 32, walkScore: 31 },
  Virginia: { costOfLivingIndex: 104, crimeIndex: 92, avgAnnualSalary: 68000, unemploymentPct: 3.2, stateIncomeTaxPct: 5.75, avgSalesTaxPct: 5.8, schoolRating: 7.1, avgHighF: 66, avgLowF: 44, walkScore: 37 },
  Washington: { costOfLivingIndex: 118, crimeIndex: 98, avgAnnualSalary: 78000, unemploymentPct: 4.5, stateIncomeTaxPct: 0, avgSalesTaxPct: 9.4, schoolRating: 7.0, avgHighF: 60, avgLowF: 42, walkScore: 44 },
  "West Virginia": { costOfLivingIndex: 86, crimeIndex: 102, avgAnnualSalary: 48000, unemploymentPct: 4.5, stateIncomeTaxPct: 6.5, avgSalesTaxPct: 6.5, schoolRating: 6.0, avgHighF: 64, avgLowF: 42, walkScore: 24 },
  Wisconsin: { costOfLivingIndex: 95, crimeIndex: 90, avgAnnualSalary: 58000, unemploymentPct: 3.0, stateIncomeTaxPct: 7.65, avgSalesTaxPct: 5.4, schoolRating: 7.0, avgHighF: 56, avgLowF: 34, walkScore: 32 },
  Wyoming: { costOfLivingIndex: 96, crimeIndex: 88, avgAnnualSalary: 58000, unemploymentPct: 3.0, stateIncomeTaxPct: 0, avgSalesTaxPct: 5.4, schoolRating: 6.8, avgHighF: 58, avgLowF: 32, walkScore: 28 },
};

const US_AVERAGE: StateQoLProfile = {
  costOfLivingIndex: 100,
  crimeIndex: 100,
  avgAnnualSalary: 62000,
  unemploymentPct: 3.8,
  stateIncomeTaxPct: 5,
  avgSalesTaxPct: 7,
  schoolRating: 6.6,
  avgHighF: 65,
  avgLowF: 45,
  walkScore: 35,
};

export interface QoLSummary {
  label: string;
  state: string | null;
  profile: StateQoLProfile;
}

export interface QoLComparisonMetric {
  key: string;
  labelKey: string;
  originValue: string;
  destinationValue: string;
  originNum: number;
  destNum: number;
  trend: HousingTrend;
  direction: ComparisonDirection;
}

function profileForLocation(location: ResolvedLocation): QoLSummary {
  const state = normalizeUsState(location.state);
  const profile = state ? (STATE_QOL[state] ?? US_AVERAGE) : US_AVERAGE;
  return { label: location.label, state, profile };
}

function colIndexLabel(index: number): string {
  if (index < 95) return "belowAvg";
  if (index > 105) return "aboveAvg";
  return "nearAvg";
}

function metric(
  key: string,
  labelKey: string,
  originNum: number,
  destNum: number,
  originValue: string,
  destValue: string,
  lowerIsBetter: boolean,
  options?: { informationalOnly?: boolean }
): QoLComparisonMetric {
  const { trend, direction } = compareValues(originNum, destNum, lowerIsBetter, {
    informationalOnly: options?.informationalOnly,
  });
  return {
    key,
    labelKey,
    originValue,
    destinationValue: destValue,
    originNum,
    destNum,
    trend,
    direction,
  };
}

export function buildQoLComparison(
  origin: ResolvedLocation,
  destination: ResolvedLocation
): { origin: QoLSummary; destination: QoLSummary; metrics: QoLComparisonMetric[] } {
  const o = profileForLocation(origin);
  const d = profileForLocation(destination);
  const op = o.profile;
  const dp = d.profile;

  const metrics: QoLComparisonMetric[] = [
    metric(
      "colIndex",
      "cityComparison.qol.colIndex",
      op.costOfLivingIndex,
      dp.costOfLivingIndex,
      colIndexLabel(op.costOfLivingIndex),
      colIndexLabel(dp.costOfLivingIndex),
      true
    ),
    metric(
      "crimeIndex",
      "cityComparison.qol.crimeIndex",
      op.crimeIndex,
      dp.crimeIndex,
      `${op.crimeIndex}`,
      `${dp.crimeIndex}`,
      true
    ),
    metric(
      "avgSalary",
      "cityComparison.qol.avgSalary",
      op.avgAnnualSalary,
      dp.avgAnnualSalary,
      String(op.avgAnnualSalary),
      String(dp.avgAnnualSalary),
      false
    ),
    metric(
      "unemployment",
      "cityComparison.qol.unemployment",
      op.unemploymentPct,
      dp.unemploymentPct,
      String(op.unemploymentPct),
      String(dp.unemploymentPct),
      true
    ),
    metric(
      "incomeTax",
      "cityComparison.qol.incomeTax",
      op.stateIncomeTaxPct,
      dp.stateIncomeTaxPct,
      String(op.stateIncomeTaxPct),
      String(dp.stateIncomeTaxPct),
      true
    ),
    metric(
      "salesTax",
      "cityComparison.qol.salesTax",
      op.avgSalesTaxPct,
      dp.avgSalesTaxPct,
      String(op.avgSalesTaxPct),
      String(dp.avgSalesTaxPct),
      true
    ),
    metric(
      "schoolRating",
      "cityComparison.qol.schoolRating",
      op.schoolRating,
      dp.schoolRating,
      String(op.schoolRating),
      String(dp.schoolRating),
      false
    ),
    metric(
      "climate",
      "cityComparison.qol.climate",
      op.avgHighF,
      dp.avgHighF,
      String(op.avgHighF),
      String(dp.avgHighF),
      false,
      { informationalOnly: true }
    ),
    metric(
      "walkScore",
      "cityComparison.qol.walkScore",
      op.walkScore,
      dp.walkScore,
      String(op.walkScore),
      String(dp.walkScore),
      false
    ),
  ];

  return { origin: o, destination: d, metrics };
}

export interface ComparisonVerdict {
  overall: "better" | "worse" | "mixed";
  scoreOrigin: number;
  scoreDest: number;
  highlights: { key: string; trend: HousingTrend }[];
}

/** Simple weighted verdict for destination vs origin. */
export function buildComparisonVerdict(
  housingBetterCount: number,
  housingWorseCount: number,
  essentialsBetterCount: number,
  essentialsWorseCount: number,
  qolMetrics: QoLComparisonMetric[]
): ComparisonVerdict {
  let scoreOrigin = 0;
  let scoreDest = 0;
  const highlights: { key: string; trend: HousingTrend }[] = [];

  for (const m of qolMetrics) {
    if (m.trend === "better") scoreDest += 1;
    else if (m.trend === "worse") scoreDest -= 1;
    else scoreOrigin += 0;
    if (m.trend !== "neutral") highlights.push({ key: m.labelKey, trend: m.trend });
  }

  scoreDest += housingBetterCount - housingWorseCount;
  scoreDest += essentialsBetterCount - essentialsWorseCount;

  const overall =
    scoreDest >= 2 ? "better" : scoreDest <= -2 ? "worse" : "mixed";

  return {
    overall,
    scoreOrigin: housingWorseCount + essentialsWorseCount,
    scoreDest: housingBetterCount + essentialsBetterCount,
    highlights: highlights.slice(0, 5),
  };
}
