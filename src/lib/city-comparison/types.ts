import type { EssentialsComparisonMetric, EssentialsSummary } from "@/lib/cost-of-living/essentials";
import type { QoLComparisonMetric, QoLSummary, ComparisonVerdict } from "@/lib/cost-of-living/qol-metrics";
import type { HousingMarketResponse } from "@/lib/rentcast/types";

export interface CityComparisonResponse extends HousingMarketResponse {
  essentials?: {
    origin: EssentialsSummary | null;
    destination: EssentialsSummary | null;
    metrics: EssentialsComparisonMetric[];
  };
  qualityOfLife?: {
    origin: QoLSummary | null;
    destination: QoLSummary | null;
    metrics: QoLComparisonMetric[];
  };
  verdict?: ComparisonVerdict;
}
