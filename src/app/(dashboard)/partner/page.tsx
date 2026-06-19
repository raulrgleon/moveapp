"use client";

import { useCallback, useEffect, useState } from "react";
import { Handshake, Loader2, RefreshCw, MessageSquareQuote } from "lucide-react";
import { EmptyState } from "@/components/dashboard/empty-state";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
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
                  <p className="text-sm flex flex-col gap-1 sm:flex-row sm:flex-wrap sm:items-center break-words">
                    <span>
                      <span className="font-medium">{data.moveSummary.origin}</span>
                      {" → "}
                      <span className="font-medium">{data.moveSummary.destination}</span>
                    </span>
                    <span className="hidden sm:inline text-muted-foreground">·</span>
                    <span>{formatDate(data.moveSummary.moveDate, locale)}</span>
                    <span className="hidden sm:inline text-muted-foreground">·</span>
                    <span>{data.moveSummary.household}</span>
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
                  <EmptyState
                    icon={MessageSquareQuote}
                    emoji="📋"
                    title={t("partnerPage.noQuotesTitle")}
                    description={t("partnerPage.noQuotesDesc")}
                    className="py-10"
                  />
                ) : (
                  <QuoteComparator
                    quotes={data.quotes}
                    diyEstimate={diyEstimate}
                    onStatusChange={(id, status) => void updateQuoteStatus(id, status)}
                  />
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
