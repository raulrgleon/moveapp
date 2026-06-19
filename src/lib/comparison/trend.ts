import type { HousingTrend } from "@/lib/rentcast/types";

export type ComparisonDirection = "higher" | "lower" | "neutral";

export interface ComparisonResult {
  trend: HousingTrend;
  direction: ComparisonDirection;
}

export function compareValues(
  originNum: number | null | undefined,
  destNum: number | null | undefined,
  lowerIsBetter: boolean,
  options?: { informationalOnly?: boolean; thresholdRatio?: number; minThreshold?: number }
): ComparisonResult {
  if (originNum == null || destNum == null || Number.isNaN(originNum) || Number.isNaN(destNum)) {
    return { trend: "neutral", direction: "neutral" };
  }

  const ratio = options?.thresholdRatio ?? 0.04;
  const minThreshold = options?.minThreshold ?? 0.5;
  const threshold = Math.max(Math.abs(originNum) * ratio, minThreshold);
  const diff = destNum - originNum;

  if (Math.abs(diff) <= threshold) {
    return { trend: "neutral", direction: "neutral" };
  }

  const direction: ComparisonDirection = diff > 0 ? "higher" : "lower";

  if (options?.informationalOnly) {
    return { trend: "neutral", direction };
  }

  let trend: HousingTrend;
  if (lowerIsBetter) {
    trend = diff < 0 ? "better" : "worse";
  } else {
    trend = diff > 0 ? "better" : "worse";
  }

  return { trend, direction };
}
