import { resolveZipFromQuery } from "@/lib/geo/resolve-zip";
import { compareValues } from "@/lib/comparison/trend";
import type {
  ComparisonDirection,
  HousingComparisonMetric,
  HousingTrend,
  MarketLocationSummary,
} from "@/lib/rentcast/types";

const BASE = "https://api.rentcast.io/v1";

interface BedroomRentRow {
  bedrooms: number;
  medianRent?: number;
  averageRent?: number;
}

interface BedroomSaleRow {
  bedrooms: number;
  medianPrice?: number;
  averagePrice?: number;
}

interface RentCastMarket {
  zipCode: string;
  saleData?: {
    lastUpdatedDate?: string;
    medianPrice?: number;
    averagePrice?: number;
    medianPricePerSquareFoot?: number;
    medianDaysOnMarket?: number;
    totalListings?: number;
    dataByBedrooms?: BedroomSaleRow[];
  };
  rentalData?: {
    lastUpdatedDate?: string;
    medianRent?: number;
    averageRent?: number;
    medianRentPerSquareFoot?: number;
    totalListings?: number;
    dataByBedrooms?: BedroomRentRow[];
  };
}

function getApiKey(): string {
  const key = process.env.RENTCAST_API_KEY;
  if (!key) throw new Error("RENTCAST_API_KEY not configured");
  return key;
}

export async function fetchMarketStats(zipCode: string): Promise<RentCastMarket | null> {
  const key = getApiKey();
  const url = `${BASE}/markets?zipCode=${encodeURIComponent(zipCode)}&dataType=All&historyRange=6`;

  try {
    const res = await fetch(url, {
      headers: { "X-Api-Key": key, Accept: "application/json" },
      next: { revalidate: 86400 },
    });
    if (!res.ok) return null;
    return (await res.json()) as RentCastMarket;
  } catch {
    return null;
  }
}

function bedRent(data: RentCastMarket, bedrooms: number): number | null {
  const row = data.rentalData?.dataByBedrooms?.find((b) => b.bedrooms === bedrooms);
  return row?.medianRent ?? row?.averageRent ?? null;
}

function rentsByBedroom(data: RentCastMarket): Partial<Record<1 | 2 | 3 | 4, number | null>> {
  const beds: Array<1 | 2 | 3 | 4> = [1, 2, 3, 4];
  const map: Partial<Record<1 | 2 | 3 | 4, number | null>> = {};
  for (const bed of beds) {
    map[bed] = bedRent(data, bed);
  }
  return map;
}

export function rentForBedrooms(
  summary: Pick<MarketLocationSummary, "rentByBedrooms" | "rent2Bed" | "medianRent">,
  bedrooms: number
): number | null {
  const bed = Math.min(4, Math.max(1, bedrooms)) as 1 | 2 | 3 | 4;
  const direct = summary.rentByBedrooms?.[bed];
  if (direct != null) return direct;
  if (bed === 2 && summary.rent2Bed != null) return summary.rent2Bed;
  if (summary.rent2Bed != null) {
    const factor = bed === 1 ? 0.72 : bed === 3 ? 1.22 : bed === 4 ? 1.42 : 1;
    return Math.round(summary.rent2Bed * factor);
  }
  return summary.medianRent;
}

export function applyRecommendedBedrooms(
  summary: MarketLocationSummary,
  recommendedBedrooms: number
): MarketLocationSummary {
  return {
    ...summary,
    recommendedBedrooms,
    recommendedRent: rentForBedrooms(summary, recommendedBedrooms),
  };
}

function summarizeMarket(label: string, zipCode: string, data: RentCastMarket): MarketLocationSummary {
  const rentByBedrooms = rentsByBedroom(data);
  const rent2Bed = rentByBedrooms[2] ?? bedRent(data, 2);
  return {
    label,
    zipCode,
    averageRent: data.rentalData?.averageRent ?? null,
    medianRent: data.rentalData?.medianRent ?? null,
    rent2Bed,
    rentByBedrooms,
    recommendedBedrooms: 2,
    recommendedRent: rent2Bed,
    medianHomePrice: data.saleData?.medianPrice ?? null,
    averageHomePrice: data.saleData?.averagePrice ?? null,
    medianPricePerSqFt: data.saleData?.medianPricePerSquareFoot ?? null,
    medianRentPerSqFt: data.rentalData?.medianRentPerSquareFoot ?? null,
    saleDaysOnMarket: data.saleData?.medianDaysOnMarket ?? null,
    rentalListings: data.rentalData?.totalListings ?? null,
    saleListings: data.saleData?.totalListings ?? null,
    lastUpdated: data.rentalData?.lastUpdatedDate ?? data.saleData?.lastUpdatedDate,
  };
}

export function emptyMarketSummary(label: string, zipCode: string): MarketLocationSummary {
  return {
    label,
    zipCode,
    averageRent: null,
    medianRent: null,
    rent2Bed: null,
    rentByBedrooms: {},
    recommendedBedrooms: 2,
    recommendedRent: null,
    medianHomePrice: null,
    averageHomePrice: null,
    medianPricePerSqFt: null,
    medianRentPerSqFt: null,
    saleDaysOnMarket: null,
    rentalListings: null,
    saleListings: null,
  };
}

function fmtMoney(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

function fmtPerSqFt(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return `$${value.toFixed(2)}/sq ft`;
}

function fmtCount(value: number | null | undefined): string {
  if (value == null || Number.isNaN(value)) return "—";
  return value.toLocaleString("en-US");
}

function compareHousing(
  originNum: number | null,
  destNum: number | null,
  lowerIsBetter: boolean
): { trend: HousingTrend; direction: ComparisonDirection } {
  return compareValues(originNum, destNum, lowerIsBetter, {
    thresholdRatio: 0.03,
    minThreshold: 1,
  });
}

function metric(
  key: string,
  labelKey: string,
  originNum: number | null,
  destNum: number | null,
  originValue: string,
  destValue: string,
  lowerIsBetter: boolean,
  options?: {
    labelParams?: Record<string, string | number>;
    informationalOnly?: boolean;
  }
): HousingComparisonMetric {
  const { trend, direction } = compareHousing(originNum, destNum, lowerIsBetter);
  return {
    key,
    labelKey,
    labelParams: options?.labelParams,
    originValue,
    destinationValue: destValue,
    trend,
    direction,
    higherIsFavorable: !lowerIsBetter,
    informationalOnly: options?.informationalOnly,
  };
}

export function buildComparisonMetrics(
  origin: MarketLocationSummary,
  destination: MarketLocationSummary,
  recommendedBedrooms: number
): HousingComparisonMetric[] {
  const beds = recommendedBedrooms;
  const originRent = origin.recommendedRent;
  const destRent = destination.recommendedRent;

  return [
    metric(
      "recommendedRent",
      "cityComparison.recommendedRent",
      originRent,
      destRent,
      originRent != null ? `${fmtMoney(originRent)}/mo` : "—",
      destRent != null ? `${fmtMoney(destRent)}/mo` : "—",
      true,
      { labelParams: { bedrooms: beds } }
    ),
    metric(
      "medianHome",
      "cityComparison.medianHome",
      origin.medianHomePrice,
      destination.medianHomePrice,
      fmtMoney(origin.medianHomePrice),
      fmtMoney(destination.medianHomePrice),
      true
    ),
    metric(
      "rentalListings",
      "cityComparison.rentalListings",
      origin.rentalListings,
      destination.rentalListings,
      fmtCount(origin.rentalListings),
      fmtCount(destination.rentalListings),
      false
    ),
    metric(
      "saleListings",
      "cityComparison.saleListings",
      origin.saleListings,
      destination.saleListings,
      fmtCount(origin.saleListings),
      fmtCount(destination.saleListings),
      false
    ),
    metric(
      "priceSqFt",
      "cityComparison.priceSqFt",
      origin.medianPricePerSqFt,
      destination.medianPricePerSqFt,
      fmtPerSqFt(origin.medianPricePerSqFt),
      fmtPerSqFt(destination.medianPricePerSqFt),
      true
    ),
    metric(
      "rentSqFt",
      "cityComparison.rentSqFt",
      origin.medianRentPerSqFt,
      destination.medianRentPerSqFt,
      fmtPerSqFt(origin.medianRentPerSqFt),
      fmtPerSqFt(destination.medianRentPerSqFt),
      true
    ),
    metric(
      "saleDom",
      "cityComparison.saleDom",
      origin.saleDaysOnMarket,
      destination.saleDaysOnMarket,
      origin.saleDaysOnMarket != null ? `${Math.round(origin.saleDaysOnMarket)} days` : "—",
      destination.saleDaysOnMarket != null ? `${Math.round(destination.saleDaysOnMarket)} days` : "—",
      true
    ),
  ];
}

export async function fetchHousingComparison(
  originLabel: string,
  destinationLabel: string,
  recommendedBedrooms = 2
): Promise<{
  origin: MarketLocationSummary | null;
  destination: MarketLocationSummary | null;
  metrics: HousingComparisonMetric[];
}> {
  const [originZip, destZip] = await Promise.all([
    resolveZipFromQuery(originLabel),
    resolveZipFromQuery(destinationLabel),
  ]);

  if (!originZip && !destZip) {
    return { origin: null, destination: null, metrics: [] };
  }

  const [originMarket, destMarket] = await Promise.all([
    originZip ? fetchMarketStats(originZip) : Promise.resolve(null),
    destZip ? fetchMarketStats(destZip) : Promise.resolve(null),
  ]);

  const origin =
    originZip && originMarket
      ? applyRecommendedBedrooms(summarizeMarket(originLabel, originZip, originMarket), recommendedBedrooms)
      : originZip
        ? applyRecommendedBedrooms(emptyMarketSummary(originLabel, originZip), recommendedBedrooms)
        : null;

  const destination =
    destZip && destMarket
      ? applyRecommendedBedrooms(summarizeMarket(destinationLabel, destZip, destMarket), recommendedBedrooms)
      : destZip
        ? applyRecommendedBedrooms(emptyMarketSummary(destinationLabel, destZip), recommendedBedrooms)
        : null;

  const metrics =
    origin && destination ? buildComparisonMetrics(origin, destination, recommendedBedrooms) : [];

  return { origin, destination, metrics };
}
