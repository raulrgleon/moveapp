import type { HousingComparisonMetric, HousingMarketResponse } from "@/lib/rentcast/types";
import { buildComparisonMetrics } from "@/lib/rentcast/rentcast";

/** Static ZIP-level estimates when RentCast is unavailable. */
const FALLBACK_BY_ZIP: Record<
  string,
  {
    averageRent: number;
    medianRent: number;
    rent2Bed: number;
    medianHomePrice: number;
    averageHomePrice: number;
    medianPricePerSqFt: number;
    medianRentPerSqFt: number;
    saleDaysOnMarket: number;
    rentalListings: number;
    saleListings: number;
  }
> = {
  "78701": {
    averageRent: 2100,
    medianRent: 1980,
    rent2Bed: 1850,
    medianHomePrice: 520000,
    averageHomePrice: 545000,
    medianPricePerSqFt: 285,
    medianRentPerSqFt: 2.1,
    saleDaysOnMarket: 42,
    rentalListings: 890,
    saleListings: 420,
  },
  "25701": {
    averageRent: 980,
    medianRent: 920,
    rent2Bed: 850,
    medianHomePrice: 165000,
    averageHomePrice: 178000,
    medianPricePerSqFt: 98,
    medianRentPerSqFt: 0.95,
    saleDaysOnMarket: 58,
    rentalListings: 120,
    saleListings: 95,
  },
  "90210": {
    averageRent: 3200,
    medianRent: 2950,
    rent2Bed: 2800,
    medianHomePrice: 1250000,
    averageHomePrice: 1380000,
    medianPricePerSqFt: 520,
    medianRentPerSqFt: 3.4,
    saleDaysOnMarket: 35,
    rentalListings: 2100,
    saleListings: 1800,
  },
  "10001": {
    averageRent: 3800,
    medianRent: 3600,
    rent2Bed: 3400,
    medianHomePrice: 890000,
    averageHomePrice: 920000,
    medianPricePerSqFt: 410,
    medianRentPerSqFt: 3.8,
    saleDaysOnMarket: 48,
    rentalListings: 4500,
    saleListings: 2200,
  },
};

const DEFAULT_FALLBACK = {
  averageRent: 1400,
  medianRent: 1300,
  rent2Bed: 1200,
  medianHomePrice: 320000,
  averageHomePrice: 345000,
  medianPricePerSqFt: 165,
  medianRentPerSqFt: 1.35,
  saleDaysOnMarket: 45,
  rentalListings: 500,
  saleListings: 300,
};

function summaryForZip(label: string, zipCode: string) {
  const data = FALLBACK_BY_ZIP[zipCode] ?? DEFAULT_FALLBACK;
  return {
    label,
    zipCode,
    averageRent: data.averageRent,
    medianRent: data.medianRent,
    rent2Bed: data.rent2Bed,
    medianHomePrice: data.medianHomePrice,
    averageHomePrice: data.averageHomePrice,
    medianPricePerSqFt: data.medianPricePerSqFt,
    medianRentPerSqFt: data.medianRentPerSqFt,
    saleDaysOnMarket: data.saleDaysOnMarket,
    rentalListings: data.rentalListings,
    saleListings: data.saleListings,
    lastUpdated: undefined,
  };
}

export function buildFallbackHousingComparison(
  originLabel: string,
  originZip: string,
  destinationLabel: string,
  destinationZip: string
): HousingMarketResponse {
  const origin = summaryForZip(originLabel, originZip);
  const destination = summaryForZip(destinationLabel, destinationZip);
  const metrics: HousingComparisonMetric[] = buildComparisonMetrics(origin, destination);
  return {
    origin,
    destination,
    metrics,
    source: "fallback",
  };
}
