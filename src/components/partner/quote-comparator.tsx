"use client";

import { AlertTriangle } from "lucide-react";
import { useLocale, useT } from "@/contexts/locale-context";
import type { PartnerQuoteRow } from "@/lib/partner/quote-utils";
import {
  detectQuoteRedFlags,
  quoteAmountLabel,
  quoteDisplayAmount,
  quoteServicesSummary,
} from "@/lib/partner/quote-utils";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TableScroll } from "@/components/dashboard/table-scroll";

interface QuoteComparatorProps {
  quotes: PartnerQuoteRow[];
  diyEstimate: number;
  onStatusChange: (quoteId: string, status: string) => void;
}

export function QuoteComparator({ quotes, diyEstimate, onStatusChange }: QuoteComparatorProps) {
  const t = useT();
  const { locale } = useLocale();

  if (!quotes.length) return null;

  const sorted = [...quotes].sort((a, b) => {
    const aa = quoteDisplayAmount(a) ?? Number.MAX_SAFE_INTEGER;
    const bb = quoteDisplayAmount(b) ?? Number.MAX_SAFE_INTEGER;
    return aa - bb;
  });

  const lowest = quoteDisplayAmount(sorted[0]);

  return (
    <div className="space-y-3">
      <TableScroll>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("partnerPage.colCompany")}</TableHead>
              <TableHead>{t("partnerPage.colAmount")}</TableHead>
              <TableHead className="hidden md:table-cell">{t("partnerPage.colServices")}</TableHead>
              <TableHead>{t("partnerPage.colVsDiy")}</TableHead>
              <TableHead>{t("partnerPage.colStatus")}</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((quote) => {
              const amount = quoteDisplayAmount(quote);
              const vsDiy =
                amount != null && diyEstimate > 0
                  ? amount - diyEstimate
                  : null;
              const flags = detectQuoteRedFlags(quote, diyEstimate);
              const isBest = amount != null && lowest != null && amount === lowest;

              return (
                <TableRow key={quote.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{quote.companyName}</p>
                      <p className="text-xs text-muted-foreground">{quote.contactEmail}</p>
                      {flags.length > 0 && (
                        <p className="text-xs text-amber-600 flex items-center gap-1 mt-1">
                          <AlertTriangle className="h-3 w-3" />
                          {t("partnerPage.redFlagReview")}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">
                        {quoteAmountLabel(quote, locale, formatCurrency)}
                      </span>
                      {isBest && quote.status !== "declined" && (
                        <Badge variant="default" className="text-[10px]">
                          {t("partnerPage.bestPrice")}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-xs text-muted-foreground">
                    {quoteServicesSummary(quote, locale).join(" · ") || "—"}
                  </TableCell>
                  <TableCell>
                    {vsDiy == null ? (
                      "—"
                    ) : (
                      <span className={vsDiy <= 0 ? "text-emerald-600" : "text-amber-700"}>
                        {vsDiy <= 0 ? "" : "+"}
                        {formatCurrency(vsDiy, locale)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={quote.status === "hired" || quote.status === "accepted" ? "default" : "secondary"}>
                      {t(`partnerPage.status.${quote.status}` as "partnerPage.status.pending")}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {quote.status === "pending" && (
                        <>
                          <Button size="sm" variant="outline" onClick={() => onStatusChange(quote.id, "negotiating")}>
                            {t("partnerPage.negotiate")}
                          </Button>
                          <Button size="sm" onClick={() => onStatusChange(quote.id, "accepted")}>
                            {t("partnerPage.acceptQuote")}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => onStatusChange(quote.id, "declined")}>
                            {t("partnerPage.declineQuote")}
                          </Button>
                        </>
                      )}
                      {quote.status === "negotiating" && (
                        <>
                          <Button size="sm" onClick={() => onStatusChange(quote.id, "hired")}>
                            {t("partnerPage.markHired")}
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => onStatusChange(quote.id, "declined")}>
                            {t("partnerPage.declineQuote")}
                          </Button>
                        </>
                      )}
                      {(quote.status === "accepted" || quote.status === "hired") && (
                        <Button size="sm" variant="outline" onClick={() => onStatusChange(quote.id, "completed")}>
                          {t("partnerPage.markCompleted")}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableScroll>
    </div>
  );
}
