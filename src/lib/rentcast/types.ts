export interface MarketLocationSummary {
  label: string;
  zipCode: string;
  averageRent: number | null;
  medianRent: number | null;
  rent2Bed: number | null;
  medianHomePrice: number | null;
  averageHomePrice: number | null;
  medianPricePerSqFt: number | null;
  medianRentPerSqFt: number | null;
  saleDaysOnMarket: number | null;
  rentalListings: number | null;
  saleListings: number | null;
  lastUpdated?: string;
}

export type HousingTrend = "better" | "worse" | "neutral";

export interface HousingComparisonMetric {
  key: string;
  labelKey: string;
  originValue: string;
  destinationValue: string;
  trend: HousingTrend;
}

export interface HousingMarketResponse {
  origin: MarketLocationSummary | null;
  destination: MarketLocationSummary | null;
  metrics: HousingComparisonMetric[];
}
