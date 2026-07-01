export interface AmazonCartItemInput {
  name: string;
  quantity: number;
  asin?: string;
  selected: boolean;
}

function normalizeMarketplaceDomain(domain?: string): string {
  const raw = (domain ?? "www.amazon.com").trim();
  if (!raw) return "www.amazon.com";
  return raw.replace(/^https?:\/\//i, "").replace(/\/+$/, "");
}

/**
 * Build Amazon Add-To-Cart URL.
 *
 * Notes:
 * - Only selected items with valid ASIN are included.
 * - No scraping is used anywhere in this flow.
 * - Payments happen on Amazon only.
 */
export function buildAmazonCartUrl(
  items: AmazonCartItemInput[],
  associateTag: string,
  marketplaceDomain: string
): string | null {
  const valid = items
    .filter((item) => item.selected)
    .filter((item) => Number.isFinite(item.quantity) && item.quantity >= 1)
    .filter((item) => (item.asin ?? "").trim().length > 0);

  if (!valid.length) return null;

  const params = new URLSearchParams();
  valid.forEach((item, idx) => {
    const position = idx + 1;
    params.set(`ASIN.${position}`, item.asin!.trim());
    params.set(`Quantity.${position}`, String(Math.max(1, Math.floor(item.quantity))));
  });

  if (associateTag.trim()) {
    params.set("AssociateTag", associateTag.trim());
  }

  const domain = normalizeMarketplaceDomain(marketplaceDomain);
  return `https://${domain}/gp/aws/cart/add.html?${params.toString()}`;
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
