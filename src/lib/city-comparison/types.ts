import type { EssentialsComparisonMetric, EssentialsSummary } from "@/lib/cost-of-living/essentials";
import type { HousingMarketResponse } from "@/lib/rentcast/types";

export interface CityComparisonResponse extends HousingMarketResponse {
  essentials?: {
    origin: EssentialsSummary | null;
    destination: EssentialsSummary | null;
    metrics: EssentialsComparisonMetric[];
  };
}
