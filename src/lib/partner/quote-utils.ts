import type { Locale } from "@/lib/i18n";
import { serviceTypeLabel } from "@/lib/partner/move-brief";

export interface PartnerQuoteRow {
  id: string;
  companyName: string;
  contactEmail: string;
  contactPhone: string | null;
  amount: number | null;
  amountMin: number | null;
  amountMax: number | null;
  message: string | null;
  serviceType: string | null;
  includesPacking: boolean;
  includesInsurance: boolean;
  usdotNumber: string | null;
  availableDate: string | null;
  status: string;
  createdAt: string;
}

export function quoteDisplayAmount(quote: Pick<PartnerQuoteRow, "amount" | "amountMin" | "amountMax">): number | null {
  if (quote.amount != null && quote.amount > 0) return quote.amount;
  if (quote.amountMin != null && quote.amountMax != null) {
    return Math.round((quote.amountMin + quote.amountMax) / 2);
  }
  if (quote.amountMin != null) return quote.amountMin;
  if (quote.amountMax != null) return quote.amountMax;
  return null;
}

export function quoteAmountLabel(
  quote: Pick<PartnerQuoteRow, "amount" | "amountMin" | "amountMax">,
  locale: Locale,
  formatCurrency: (n: number, locale: Locale) => string
): string {
  if (quote.amount != null && quote.amount > 0) {
    return formatCurrency(quote.amount, locale);
  }
  if (quote.amountMin != null && quote.amountMax != null) {
    return locale === "es"
      ? `${formatCurrency(quote.amountMin, locale)} – ${formatCurrency(quote.amountMax, locale)}`
      : `${formatCurrency(quote.amountMin, locale)} – ${formatCurrency(quote.amountMax, locale)}`;
  }
  if (quote.amountMin != null) {
    return locale === "es"
      ? `Desde ${formatCurrency(quote.amountMin, locale)}`
      : `From ${formatCurrency(quote.amountMin, locale)}`;
  }
  if (quote.amountMax != null) {
    return locale === "es"
      ? `Hasta ${formatCurrency(quote.amountMax, locale)}`
      : `Up to ${formatCurrency(quote.amountMax, locale)}`;
  }
  return locale === "es" ? "Sin monto" : "No amount";
}

export function lowestQuoteAmount(quotes: PartnerQuoteRow[]): number | null {
  const amounts = quotes
    .filter((q) => !["declined"].includes(q.status))
    .map((q) => quoteDisplayAmount(q))
    .filter((n): n is number => n != null && n > 0);
  if (!amounts.length) return null;
  return Math.min(...amounts);
}

export function compareDiyVsMover(
  diyEstimate: number,
  moverAmount: number | null
): { delta: number; moverCheaper: boolean; savings: number } | null {
  if (!diyEstimate || !moverAmount) return null;
  const delta = moverAmount - diyEstimate;
  return {
    delta,
    moverCheaper: delta < 0,
    savings: Math.abs(delta),
  };
}

export function quoteServicesSummary(quote: PartnerQuoteRow, locale: Locale): string[] {
  const lines: string[] = [];
  if (quote.serviceType) {
    lines.push(serviceTypeLabel(quote.serviceType, locale));
  }
  if (quote.includesPacking) {
    lines.push(locale === "es" ? "Embalaje incluido" : "Packing included");
  }
  if (quote.includesInsurance) {
    lines.push(locale === "es" ? "Seguro incluido" : "Insurance included");
  }
  if (quote.usdotNumber) {
    lines.push(locale === "es" ? `USDOT ${quote.usdotNumber}` : `USDOT ${quote.usdotNumber}`);
  }
  if (quote.availableDate) {
    lines.push(
      locale === "es" ? `Disponible: ${quote.availableDate}` : `Available: ${quote.availableDate}`
    );
  }
  return lines;
}

export function detectQuoteRedFlags(
  quote: PartnerQuoteRow,
  diyEstimate: number
): string[] {
  const flags: string[] = [];
  const amount = quoteDisplayAmount(quote);
  if (amount != null && diyEstimate > 0 && amount < diyEstimate * 0.35) {
    flags.push("price_too_low");
  }
  if (!quote.usdotNumber && quote.amount != null && quote.amount > 1500) {
    flags.push("missing_usdot");
  }
  return flags;
}
