export interface AmazonCartItemInput {
  name: string;
  quantity: number;
  asin?: string;
  selected: boolean;
}

export interface AmazonCartFormConfig {
  action: string;
  fields: Record<string, string>;
}

/** Amazon's add-to-cart form accepts up to 10 items per request. */
export const AMAZON_CART_MAX_ITEMS = 10;

function normalizeMarketplaceDomain(domain?: string): string {
  const raw = (domain ?? "www.amazon.com").trim();
  if (!raw) return "www.amazon.com";
  return raw.replace(/^https?:\/\//i, "").replace(/\/+$/, "");
}

function getValidCartItems(items: AmazonCartItemInput[]): AmazonCartItemInput[] {
  return items
    .filter((item) => item.selected)
    .filter((item) => Number.isFinite(item.quantity) && item.quantity >= 1)
    .filter((item) => (item.asin ?? "").trim().length > 0);
}

/**
 * Build the official Amazon Add-To-Cart form config.
 * Amazon expects a GET form to /gp/aws/cart/add.html with AssociateTag,
 * add=add, and ASIN.N / Quantity.N pairs.
 */
export function buildAmazonCartFormConfig(
  items: AmazonCartItemInput[],
  associateTag: string,
  marketplaceDomain: string
): AmazonCartFormConfig | null {
  const valid = getValidCartItems(items).slice(0, AMAZON_CART_MAX_ITEMS);
  if (!valid.length) return null;

  const fields: Record<string, string> = { add: "add" };
  const tag = associateTag.trim();
  if (tag) {
    fields.AssociateTag = tag;
    fields.tag = tag;
  }

  valid.forEach((item, idx) => {
    const position = idx + 1;
    fields[`ASIN.${position}`] = item.asin!.trim();
    fields[`Quantity.${position}`] = String(Math.max(1, Math.floor(item.quantity)));
  });

  const domain = normalizeMarketplaceDomain(marketplaceDomain);
  return {
    action: `https://${domain}/gp/aws/cart/add.html`,
    fields,
  };
}

/**
 * Build Amazon Add-To-Cart URL (same payload as the official form).
 */
export function buildAmazonCartUrl(
  items: AmazonCartItemInput[],
  associateTag: string,
  marketplaceDomain: string
): string | null {
  const config = buildAmazonCartFormConfig(items, associateTag, marketplaceDomain);
  if (!config) return null;

  const params = new URLSearchParams(config.fields);
  return `${config.action}?${params.toString()}`;
}

/**
 * Build Amazon search URL fallback when an ASIN is not configured yet.
 */
export function buildAmazonSearchUrl(
  productName: string,
  marketplaceDomain: string,
  associateTag: string
): string {
  const params = new URLSearchParams({ k: productName.trim() });
  if (associateTag.trim()) {
    params.set("tag", associateTag.trim());
  }
  const domain = normalizeMarketplaceDomain(marketplaceDomain);
  return `https://${domain}/s?${params.toString()}`;
}
