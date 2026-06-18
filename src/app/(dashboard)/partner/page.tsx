"use client";

import { useCallback, useEffect, useState } from "react";
import { Handshake, Loader2, RefreshCw } from "lucide-react";
import { PageContainer } from "@/components/dashboard/page-container";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { PageHeader } from "@/components/dashboard/page-header";
import { DiyVsMoverCard } from "@/components/partner/diy-vs-mover-card";
import { MoveBriefCard } from "@/components/partner/move-brief-card";
import { PartnerDirectory } from "@/components/partner/partner-directory";
import { PartnerShareCard } from "@/components/partner/partner-share-card";
import { QuoteComparator } from "@/components/partner/quote-comparator";
import { useT } from "@/contexts/locale-context";
import { apiFetch } from "@/lib/api-client";
import type { PartnerDirectoryEntry } from "@/lib/partner/directory";
import type { MoveBrief } from "@/lib/partner/move-brief";
import type { PartnerQuoteRow } from "@/lib/partner/quote-utils";
import { quoteAmountLabel, quoteServicesSummary } from "@/lib/partner/quote-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useLocale } from "@/contexts/locale-context";
import { subscribeProfileUpdated } from "@/lib/move/refresh-data";

interface PartnerData {
  enabled: boolean;
  shareUrl: string | null;
  quotes: PartnerQuoteRow[];
  brief?: MoveBrief;
  diyEstimate?: number;
  lowestQuote?: number | null;
  directory?: PartnerDirectoryEntry[];
  moveSummary: {
    origin: string;
    destination: string;
    moveDate: string;
    household: string;
  };
}

export default function PartnerPage() {
  const t = useT();
  const { locale } = useLocale();
  const [data, setData] = useState<PartnerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/partner/share");
      if (!res.ok) throw new Error("failed");
      setData((await res.json()) as PartnerData);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    return subscribeProfileUpdated(() => void load());
  }, [load]);

  const toggleShare = async (enabled: boolean) => {
    setToggling(true);
    try {
      await apiFetch("/api/partner/share", {
        method: "POST",
        body: JSON.stringify({ enabled }),
      });
      await load();
    } finally {
      setToggling(false);
    }
  };

  const updateQuoteStatus = async (quoteId: string, status: string) => {
    await apiFetch("/api/partner/quotes", {
      method: "PATCH",
      body: JSON.stringify({ quoteId, status }),
    });
    await load();
  };

  const diyEstimate = data?.diyEstimate ?? data?.brief?.budgetEstimate ?? 0;
  const lowestQuote = data?.lowestQuote ?? null;

  return (
    <>
      <DashboardHeader title={t("partnerPage.title")} description={t("partnerPage.subtitle")} />
      <PageContainer>
        <PageHeader
          title={t("partnerPage.pageTitle")}
          description={t("partnerPage.pageDesc")}
          action={
            <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              {t("common.update")}
            </Button>
          }
        />

        {loading && !data ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("common.loading")}
          </div>
        ) : (
          <div className="space-y-6">
            {data?.brief && <MoveBriefCard brief={data.brief} />}

            <DiyVsMoverCard diyEstimate={diyEstimate} lowestQuote={lowestQuote} />

            <Card className="border-primary/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Handshake className="h-4 w-4 text-primary" />
                  {t("partnerPage.shareTitle")}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{t("partnerPage.shareDesc")}</p>
                {data?.moveSummary && (
                  <p className="text-sm">
                    <span className="font-medium">{data.moveSummary.origin}</span>
                    {" → "}
                    <span className="font-medium">{data.moveSummary.destination}</span>
                    {" · "}
                    {formatDate(data.moveSummary.moveDate, locale)}
                    {" · "}
                    {data.moveSummary.household}
                  </p>
                )}
                <PartnerShareCard
                  enabled={data?.enabled ?? false}
                  shareUrl={data?.shareUrl ?? null}
                  onToggle={toggleShare}
                  onRefresh={load}
                  toggling={toggling}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("partnerPage.quotesTitle")}</CardTitle>
                <p className="text-sm text-muted-foreground">{t("partnerPage.quotesDesc")}</p>
              </CardHeader>
              <CardContent className="space-y-4">
                {!data?.quotes.length ? (
                  <p className="text-sm text-muted-foreground">{t("partnerPage.noQuotes")}</p>
                ) : (
                  <>
                    <QuoteComparator
                      quotes={data.quotes}
                      diyEstimate={diyEstimate}
                      onStatusChange={(id, status) => void updateQuoteStatus(id, status)}
                    />
                    <div className="space-y-3 md:hidden">
                      {data.quotes.map((q) => (
                        <div key={q.id} className="rounded-lg border p-4 space-y-2">
                          <div className="flex justify-between gap-2">
                            <p className="font-medium">{q.companyName}</p>
                            <Badge variant="secondary">
                              {t(`partnerPage.status.${q.status}` as "partnerPage.status.pending")}
                            </Badge>
                          </div>
                          <p className="text-sm font-semibold">
                            {quoteAmountLabel(q, locale, formatCurrency)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {quoteServicesSummary(q, locale).join(" · ")}
                          </p>
                          {q.message && (
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{q.message}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {data?.directory && <PartnerDirectory entries={data.directory} />}
          </div>
        )}
      </PageContainer>
    </>
  );
}
