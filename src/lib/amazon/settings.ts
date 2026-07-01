import { prisma } from "@/lib/prisma";
import { MOVING_PRODUCTS } from "@/lib/amazon/moving-shopping";

const AMAZON_ASSOCIATE_TAG_KEY = "amazon_associate_tag";
const AMAZON_MARKETPLACE_DOMAIN_KEY = "amazon_marketplace_domain";
const AMAZON_DEFAULT_PRODUCTS_KEY = "amazon_default_products";

export interface AmazonAppSettings {
  associateTag: string;
  marketplaceDomain: string;
  defaultProducts: Record<string, string>;
  hasAssociateTag: boolean;
}

export const AMAZON_DEFAULTS = {
  associateTag: "MY_ASSOCIATE_TAG",
  marketplaceDomain: "www.amazon.com",
};

function normalizeDomain(domain: string): string {
  return domain.trim().replace(/^https?:\/\//i, "").replace(/\/+$/, "");
}

function defaultProductsMap(): Record<string, string> {
  return MOVING_PRODUCTS.reduce<Record<string, string>>((acc, item) => {
    // Replace these manually with real ASINs if you want pre-filled Amazon products.
    acc[item.id] = item.defaultAsin ?? "";
    return acc;
  }, {});
}

function sanitizeDefaultProducts(input: unknown): Record<string, string> {
  const fallback = defaultProductsMap();
  if (!input || typeof input !== "object") return fallback;
  const raw = input as Record<string, unknown>;

  return Object.keys(fallback).reduce<Record<string, string>>((acc, key) => {
    const value = raw[key];
    acc[key] = typeof value === "string" ? value.trim().toUpperCase() : fallback[key];
    return acc;
  }, {});
}

export async function getAmazonAppSettings(): Promise<AmazonAppSettings> {
  const rows = await prisma.appSetting.findMany({
    where: {
      key: {
        in: [AMAZON_ASSOCIATE_TAG_KEY, AMAZON_MARKETPLACE_DOMAIN_KEY, AMAZON_DEFAULT_PRODUCTS_KEY],
      },
    },
  });

  const byKey = new Map(rows.map((r) => [r.key, r.value]));
  const associateTag = (byKey.get(AMAZON_ASSOCIATE_TAG_KEY) ?? "").trim();
  const marketplaceDomain = normalizeDomain(
    byKey.get(AMAZON_MARKETPLACE_DOMAIN_KEY) ?? AMAZON_DEFAULTS.marketplaceDomain
  );
  const parsedDefaultProducts = (() => {
    const raw = byKey.get(AMAZON_DEFAULT_PRODUCTS_KEY);
    if (!raw) return defaultProductsMap();
    try {
      return sanitizeDefaultProducts(JSON.parse(raw) as unknown);
    } catch {
      return defaultProductsMap();
    }
  })();

  return {
    associateTag,
    marketplaceDomain,
    // ASIN mapping is stored here and used by the user shopping list under the hood.
    defaultProducts: parsedDefaultProducts,
    hasAssociateTag: associateTag.length > 0,
  };
}

export async function updateAmazonAppSettings(input: {
  associateTag: string;
  marketplaceDomain: string;
  defaultProducts?: Record<string, string>;
}): Promise<AmazonAppSettings> {
  const associateTag = input.associateTag.trim();
  const marketplaceDomain = normalizeDomain(input.marketplaceDomain || AMAZON_DEFAULTS.marketplaceDomain);
  const defaultProducts = sanitizeDefaultProducts(input.defaultProducts ?? defaultProductsMap());

  if (!associateTag) {
    throw new Error("Associate tag is required");
  }
  if (!marketplaceDomain) {
    throw new Error("Marketplace domain is required");
  }

  await prisma.$transaction([
    prisma.appSetting.upsert({
      where: { key: AMAZON_ASSOCIATE_TAG_KEY },
      update: { value: associateTag },
      create: { key: AMAZON_ASSOCIATE_TAG_KEY, value: associateTag },
    }),
    prisma.appSetting.upsert({
      where: { key: AMAZON_MARKETPLACE_DOMAIN_KEY },
      update: { value: marketplaceDomain },
      create: { key: AMAZON_MARKETPLACE_DOMAIN_KEY, value: marketplaceDomain },
    }),
    prisma.appSetting.upsert({
      where: { key: AMAZON_DEFAULT_PRODUCTS_KEY },
      update: { value: JSON.stringify(defaultProducts) },
      create: { key: AMAZON_DEFAULT_PRODUCTS_KEY, value: JSON.stringify(defaultProducts) },
    }),
  ]);

  return getAmazonAppSettings();
}
