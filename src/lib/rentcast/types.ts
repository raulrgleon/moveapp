export type HousingTrend = "better" | "worse" | "neutral";

export type ComparisonDirection = "higher" | "lower" | "neutral";

export interface HousingComparisonMetric {
  key: string;
  labelKey: string;
  labelParams?: Record<string, string | number>;
  originValue: string;
  destinationValue: string;
  trend: HousingTrend;
  direction: ComparisonDirection;
  /** When destination is higher, is that favorable for the mover? */
  higherIsFavorable: boolean;
  /** Show direction only — no green/orange judgment (e.g. climate). */
  informationalOnly?: boolean;
}

export interface HousingContext {
  recommendedBedrooms: number;
  householdLabel: string;
}

export interface MarketLocationSummary {
  label: string;
  zipCode: string;
  averageRent: number | null;
  medianRent: number | null;
  rent2Bed: number | null;
  rentByBedrooms: Partial<Record<1 | 2 | 3 | 4, number | null>>;
  recommendedBedrooms: number;
  recommendedRent: number | null;
  medianHomePrice: number | null;
  averageHomePrice: number | null;
  medianPricePerSqFt: number | null;
  medianRentPerSqFt: number | null;
  saleDaysOnMarket: number | null;
  rentalListings: number | null;
  saleListings: number | null;
  lastUpdated?: string;
}

export interface HousingMarketResponse {
  origin: MarketLocationSummary | null;
  destination: MarketLocationSummary | null;
  metrics: HousingComparisonMetric[];
  housingContext?: HousingContext;
  source?: "rentcast" | "fallback";
  rentcastMissing?: boolean;
}
