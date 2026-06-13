"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Copy, ExternalLink, Handshake, Loader2, RefreshCw } from "lucide-react";
import { PageContainer } from "@/components/dashboard/page-container";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { PageHeader } from "@/components/dashboard/page-header";
import { useT } from "@/contexts/locale-context";
import { apiFetch } from "@/lib/api-client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/utils";
import { useLocale } from "@/contexts/locale-context";

interface PartnerQuote {
  id: string;
  companyName: string;
  contactEmail: string;
  contactPhone: string | null;
  amount: number | null;
  message: string | null;
  status: string;
  createdAt: string;
}

interface PartnerData {
  enabled: boolean;
  shareUrl: string | null;
  quotes: PartnerQuote[];
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
  const [copied, setCopied] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/partner/share");
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

  const copyLink = async () => {
    if (!data?.shareUrl) return;
    await navigator.clipboard.writeText(data.shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const updateQuoteStatus = async (quoteId: string, status: string) => {
    await apiFetch("/api/partner/quotes", {
      method: "PATCH",
      body: JSON.stringify({ quoteId, status }),
    });
    await load();
  };

  return (
    <>
      <DashboardHeader title={t("partnerPage.title")} description={t("partnerPage.subtitle")} />
      <PageContainer>
        <PageHeader
          title={t("partnerPage.pageTitle")}
          description={t("partnerPage.pageDesc")}
          action={
            <Button variant="outline" size="sm" onClick={() => void load()} disabled={loading}>
              <RefreshCw className="mr-2 h-4 w-4" />
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
                <div className="flex flex-wrap gap-2">
                  {data?.enabled ? (
                    <>
                      <Button variant="outline" size="sm" onClick={() => void toggleShare(false)} disabled={toggling}>
                        {t("partnerPage.disableShare")}
                      </Button>
                      <Button size="sm" onClick={() => void copyLink()}>
                        <Copy className="mr-2 h-4 w-4" />
                        {copied ? t("partnerPage.copied") : t("partnerPage.copyLink")}
                      </Button>
                      {data.shareUrl && (
                        <Button variant="outline" size="sm" asChild>
                          <a href={data.shareUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="mr-2 h-4 w-4" />
                            {t("partnerPage.previewLink")}
                          </a>
                        </Button>
                      )}
                    </>
                  ) : (
                    <Button onClick={() => void toggleShare(true)} disabled={toggling}>
                      {t("partnerPage.enableShare")}
                    </Button>
                  )}
                </div>
                {data?.enabled && data.shareUrl && (
                  <p className="text-xs font-mono text-muted-foreground break-all">{data.shareUrl}</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t("partnerPage.quotesTitle")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {!data?.quotes.length ? (
                  <p className="text-sm text-muted-foreground">{t("partnerPage.noQuotes")}</p>
                ) : (
                  data.quotes.map((q) => (
                    <div key={q.id} className="rounded-lg border p-4 space-y-2">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <p className="font-medium">{q.companyName}</p>
                          <p className="text-sm text-muted-foreground">{q.contactEmail}</p>
                        </div>
                        <Badge variant={q.status === "accepted" ? "default" : "secondary"}>
                          {t(`partnerPage.status.${q.status}` as "partnerPage.status.pending")}
                        </Badge>
                      </div>
                      {q.amount != null && (
                        <p className="text-sm font-semibold">{formatCurrency(q.amount, locale)}</p>
                      )}
                      {q.message && (
                        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{q.message}</p>
                      )}
                      {q.status === "pending" && (
                        <div className="flex gap-2 pt-1">
                          <Button size="sm" onClick={() => void updateQuoteStatus(q.id, "accepted")}>
                            {t("partnerPage.acceptQuote")}
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => void updateQuoteStatus(q.id, "declined")}>
                            {t("partnerPage.declineQuote")}
                          </Button>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </PageContainer>
    </>
  );
}
