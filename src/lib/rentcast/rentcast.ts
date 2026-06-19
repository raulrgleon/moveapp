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

function summarizeMarket(label: string, zipCode: string, data: RentCastMarket): MarketLocationSummary {
  return {
    label,
    zipCode,
    averageRent: data.rentalData?.averageRent ?? null,
    medianRent: data.rentalData?.medianRent ?? null,
    rent2Bed: bedRent(data, 2),
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
  lowerIsBetter: boolean
): HousingComparisonMetric {
  const { trend, direction } = compareHousing(originNum, destNum, lowerIsBetter);
  return {
    key,
    labelKey,
    originValue,
    destinationValue: destValue,
    trend,
    direction,
  };
}

export function buildComparisonMetrics(
  origin: MarketLocationSummary,
  destination: MarketLocationSummary
): HousingComparisonMetric[] {
  return [
    metric(
      "avgRent",
      "cityComparison.avgRent",
      origin.averageRent,
      destination.averageRent,
      fmtMoney(origin.averageRent) + "/mo",
      fmtMoney(destination.averageRent) + "/mo",
      true
    ),
    metric(
      "medianRent",
      "cityComparison.medianRent",
      origin.medianRent,
      destination.medianRent,
      fmtMoney(origin.medianRent) + "/mo",
      fmtMoney(destination.medianRent) + "/mo",
      true
    ),
    metric(
      "rent2Bed",
      "cityComparison.rent2Bed",
      origin.rent2Bed,
      destination.rent2Bed,
      fmtMoney(origin.rent2Bed) + "/mo",
      fmtMoney(destination.rent2Bed) + "/mo",
      true
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
      "avgHome",
      "cityComparison.avgHome",
      origin.averageHomePrice,
      destination.averageHomePrice,
      fmtMoney(origin.averageHomePrice),
      fmtMoney(destination.averageHomePrice),
      true
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
  ];
}

export async function fetchHousingComparison(
  originLabel: string,
  destinationLabel: string
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
      ? summarizeMarket(originLabel, originZip, originMarket)
      : originZip
        ? { label: originLabel, zipCode: originZip, averageRent: null, medianRent: null, rent2Bed: null, medianHomePrice: null, averageHomePrice: null, medianPricePerSqFt: null, medianRentPerSqFt: null, saleDaysOnMarket: null, rentalListings: null, saleListings: null }
        : null;

  const destination =
    destZip && destMarket
      ? summarizeMarket(destinationLabel, destZip, destMarket)
      : destZip
        ? { label: destinationLabel, zipCode: destZip, averageRent: null, medianRent: null, rent2Bed: null, medianHomePrice: null, averageHomePrice: null, medianPricePerSqFt: null, medianRentPerSqFt: null, saleDaysOnMarket: null, rentalListings: null, saleListings: null }
        : null;

  const metrics =
    origin && destination ? buildComparisonMetrics(origin, destination) : [];

  return { origin, destination, metrics };
}
