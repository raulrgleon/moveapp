"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { CityComparisonHint } from "@/components/budget/city-comparison-hint";
import { DiyVsMoverCard } from "@/components/partner/diy-vs-mover-card";
import { PlanShareCard } from "@/components/budget/plan-share-card";
import { PilotSuggestionCard } from "@/components/pilot/pilot-suggestion-card";
import { useMove } from "@/contexts/move-context";
import { useT } from "@/contexts/locale-context";
import { subscribeProfileUpdated } from "@/lib/move/refresh-data";
import { EstimateDisclaimer } from "@/components/marketing/estimate-disclaimer";
import { PageContainer } from "@/components/dashboard/page-container";
import { PageHeader } from "@/components/dashboard/page-header";
import { TableScroll } from "@/components/dashboard/table-scroll";
import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getStoredRouteIndex } from "@/hooks/use-route-stats";
import { apiFetch } from "@/lib/api-client";
import { formatCurrency } from "@/lib/utils";
import { AlertTriangle, DollarSign, Handshake, PiggyBank, RefreshCw, TrendingDown } from "lucide-react";

interface BudgetItemRow {
  id: string;
  category: string;
  estimated: number;
  actual: number;
  cheapestOption?: string | null;
}

interface BudgetLineBreakdown {
  category: string;
  lines: string[];
}

interface BudgetResponse {
  items: BudgetItemRow[];
  totalEstimated: number;
  totalActual: number;
  notes: string[];
  breakdowns?: BudgetLineBreakdown[];
  distanceMiles?: number;
  budgetTarget?: number;
  isEstimate?: boolean;
}

export default function BudgetPage() {
  const t = useT();
  const { truckChoice, profile } = useMove();
  const [data, setData] = useState<BudgetResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [draftActuals, setDraftActuals] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [expandedBreakdown, setExpandedBreakdown] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);
  const [partnerSummary, setPartnerSummary] = useState<{
    diyEstimate: number;
    lowestQuote: number | null;
  } | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [budgetRes, partnerRes] = await Promise.all([
        apiFetch("/api/budget"),
        apiFetch("/api/partner/share").catch(() => null),
      ]);
      const json = (await budgetRes.json()) as BudgetResponse;
      setData(json);
      const drafts: Record<string, string> = {};
      json.items.forEach((item) => {
        drafts[item.id] = item.actual > 0 ? String(item.actual) : "";
      });
      setDraftActuals(drafts);

      if (partnerRes?.ok) {
        const partner = (await partnerRes.json()) as {
          diyEstimate?: number;
          lowestQuote?: number | null;
        };
        setPartnerSummary({
          diyEstimate: partner.diyEstimate ?? json.totalEstimated,
          lowestQuote: partner.lowestQuote ?? null,
        });
      } else {
        setPartnerSummary(null);
      }
    } catch {
      setData({ items: [], totalEstimated: 0, totalActual: 0, notes: [] });
      setPartnerSummary(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  useEffect(() => {
    return subscribeProfileUpdated(() => void load());
  }, []);

  const recalculate = async () => {
    setRecalculating(true);
    setError(null);
    try {
      const res = await apiFetch("/api/budget", {
        method: "PATCH",
        body: JSON.stringify({ recalculate: true, routeIndex: getStoredRouteIndex() }),
      });
      if (!res.ok) {
        setError(t("budget.recalculateFailed"));
        return;
      }
      setData((await res.json()) as BudgetResponse);
    } catch {
      setError(t("budget.recalculateFailed"));
    } finally {
      setRecalculating(false);
    }
  };

  const saveActual = async (item: BudgetItemRow) => {
    const raw = draftActuals[item.id] ?? "";
    const actual = raw === "" ? 0 : Number(raw);
    if (!Number.isFinite(actual) || actual < 0) return;

    setSavingId(item.id);
    setError(null);
    try {
      const res = await apiFetch("/api/budget", {
        method: "PATCH",
        body: JSON.stringify({ items: [{ id: item.id, actual }] }),
      });
      if (!res.ok) {
        setError(t("budget.saveFailed"));
        return;
      }
      setData((await res.json()) as BudgetResponse);
    } catch {
      setError(t("budget.saveFailed"));
    } finally {
      setSavingId(null);
    }
  };

  const items = data?.items ?? [];
  const totalEstimated = data?.totalEstimated ?? 0;
  const totalActual = data?.totalActual ?? 0;
  const budgetTarget = data?.budgetTarget ?? profile.budget ?? 0;
  const difference = totalEstimated - totalActual;
  const isOverBudget = totalActual > totalEstimated && totalActual > 0;
  const isOverTarget = budgetTarget > 0 && totalEstimated > budgetTarget;
  const chartMax = Math.max(totalEstimated, totalActual, budgetTarget, 1);

  return (
    <>
      <DashboardHeader title={t("budget.title")} description={t("budget.subtitle")} />
      <PageContainer>
        <PageHeader
          title={t("budget.pageTitle")}
          description={t("budget.pageDesc")}
          action={
            <Button variant="outline" size="sm" onClick={recalculate} disabled={recalculating}>
              <RefreshCw className={`mr-2 h-4 w-4 ${recalculating ? "animate-spin" : ""}`} />
              {t("budget.recalculate")}
            </Button>
          }
        />

        <Card className="border-dashed bg-muted/30">
          <CardContent className="p-4 text-sm text-muted-foreground space-y-1">
            {data?.distanceMiles
              ? t("budget.estimateBannerMiles", { miles: data.distanceMiles.toLocaleString() })
              : t("budget.estimateBanner")}
            <p>{t("budget.unifiedPricingNote")}</p>
          </CardContent>
        </Card>

        <EstimateDisclaimer />

        <CityComparisonHint />

        {!truckChoice && (
          <PilotSuggestionCard
            message={t("budget.pilotPickTruck")}
            actionLabelKey="budget.goToTrucks"
            href="/trucks"
          />
        )}

        <Card className="border-dashed">
          <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <Handshake className="h-5 w-5 text-primary shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium">{t("budget.partnerCtaTitle")}</p>
              <p className="text-sm text-muted-foreground">{t("budget.partnerCtaDesc")}</p>
            </div>
            <Button asChild size="sm" variant="outline">
              <Link href="/partner">{t("budget.partnerCtaButton")}</Link>
            </Button>
          </CardContent>
        </Card>

        {partnerSummary && (
          <DiyVsMoverCard
            compact
            diyEstimate={partnerSummary.diyEstimate}
            lowestQuote={partnerSummary.lowestQuote}
          />
        )}

        <PlanShareCard />

        {syncMessage && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-4 text-sm">{syncMessage}</CardContent>
          </Card>
        )}

        {error && (
          <Card className="border-destructive/40 bg-destructive/5">
            <CardContent className="p-4 text-sm text-destructive">{error}</CardContent>
          </Card>
        )}

        {isOverTarget && (
          <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/30">
            <CardContent className="flex items-start gap-3 p-4">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-900 dark:text-amber-100">
                {t("budget.overTargetBanner", { amount: formatCurrency(budgetTarget) })}
              </p>
            </CardContent>
          </Card>
        )}

        {isOverBudget && (
          <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/30">
            <CardContent className="flex items-start gap-3 p-4">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-sm text-amber-900 dark:text-amber-100">{t("budget.overBudgetBanner")}</p>
            </CardContent>
          </Card>
        )}

        {truckChoice && (
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="p-4 text-sm">
              <span className="font-medium">{t("budget.truckChoice")}: </span>
              <span className="text-muted-foreground">{truckChoice}</span>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label={t("budget.targetBudget")}
            value={formatCurrency(budgetTarget)}
            icon={PiggyBank}
          />
          <StatCard
            label={t("budget.estimatedTotal")}
            value={formatCurrency(totalEstimated)}
            icon={DollarSign}
          />
          <StatCard
            label={t("budget.actualSpent")}
            value={formatCurrency(totalActual)}
            icon={PiggyBank}
          />
          <StatCard
            label={t("budget.remaining")}
            value={formatCurrency(difference)}
            subtext={difference >= 0 ? t("budget.underBudget") : t("budget.overBudget")}
            icon={TrendingDown}
          />
        </div>

        {items.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("budget.chartTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {items.slice(0, 8).map((item) => {
                const estPct = (item.estimated / chartMax) * 100;
                const actPct = (item.actual / chartMax) * 100;
                return (
                  <div key={item.id} className="space-y-1">
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span className="truncate pr-2">{item.category}</span>
                      <span className="shrink-0">
                        {formatCurrency(item.estimated)} / {formatCurrency(item.actual)}
                      </span>
                    </div>
                    <div className="flex gap-1 h-3 rounded overflow-hidden bg-muted/40">
                      <div
                        className="bg-primary/70 h-full rounded-sm"
                        style={{ width: `${estPct}%` }}
                        title={t("budget.chartEstimated")}
                      />
                      <div
                        className="bg-amber-500/80 h-full rounded-sm"
                        style={{ width: `${actPct}%` }}
                        title={t("budget.chartActual")}
                      />
                    </div>
                  </div>
                );
              })}
              <div className="flex gap-4 text-xs text-muted-foreground pt-2">
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-sm bg-primary/70" />
                  {t("budget.chartEstimated")}
                </span>
                <span className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-sm bg-amber-500/80" />
                  {t("budget.chartActual")}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {data?.notes && data.notes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("budget.notes")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {data.notes.map((note, i) => (
                <p key={i} className="text-sm text-muted-foreground">{note}</p>
              ))}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("budget.breakdown")}</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-sm text-muted-foreground">{t("common.loading")}</p>
            ) : items.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t("budget.empty")}</p>
            ) : (
              <TableScroll>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("budget.category")}</TableHead>
                      <TableHead className="text-right">{t("budget.estimated")}</TableHead>
                      <TableHead className="text-right">{t("budget.actual")}</TableHead>
                      <TableHead className="text-right hidden md:table-cell">{t("budget.difference")}</TableHead>
                      <TableHead className="hidden lg:table-cell">{t("budget.cheapest")}</TableHead>
                      <TableHead className="w-[100px] hidden lg:table-cell">{t("budget.howCalculated")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => {
                      const actualVal = Number(draftActuals[item.id] ?? 0) || item.actual;
                      const diff = item.estimated - actualVal;
                      const breakdown = data?.breakdowns?.find((b) => b.category === item.category);
                      return (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.category}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.estimated)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-1.5 sm:gap-2">
                              <Input
                                type="number"
                                min={0}
                                className="w-full sm:w-24 h-9 sm:h-8 text-right"
                                value={draftActuals[item.id] ?? ""}
                                onChange={(e) =>
                                  setDraftActuals((prev) => ({
                                    ...prev,
                                    [item.id]: e.target.value,
                                  }))
                                }
                              />
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-9 sm:h-8 shrink-0"
                                disabled={savingId === item.id}
                                onClick={() => saveActual(item)}
                              >
                                {savingId === item.id ? t("common.saving") : t("budget.saveActual")}
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="text-right text-emerald-600 hidden md:table-cell">
                            {diff > 0 ? formatCurrency(diff) : "—"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-[200px] hidden lg:table-cell">
                            {item.cheapestOption ?? "—"}
                          </TableCell>
                          <TableCell className="hidden lg:table-cell">
                            {breakdown && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-xs"
                                onClick={() =>
                                  setExpandedBreakdown(
                                    expandedBreakdown === item.category ? null : item.category
                                  )
                                }
                              >
                                {expandedBreakdown === item.category
                                  ? t("budget.hideCalc")
                                  : t("budget.showCalc")}
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                    {expandedBreakdown && (
                      <TableRow>
                        <TableCell colSpan={6} className="bg-muted/30">
                          <ul className="text-xs text-muted-foreground space-y-1 py-2">
                            {data?.breakdowns
                              ?.find((b) => b.category === expandedBreakdown)
                              ?.lines.map((line) => (
                                <li key={line}>• {line}</li>
                              ))}
                          </ul>
                        </TableCell>
                      </TableRow>
                    )}
                    <TableRow className="bg-muted/50 font-semibold">
                      <TableCell>{t("budget.total")}</TableCell>
                      <TableCell className="text-right">{formatCurrency(totalEstimated)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(totalActual)}</TableCell>
                      <TableCell className="text-right text-emerald-600">
                        {formatCurrency(difference)}
                      </TableCell>
                      <TableCell />
                    </TableRow>
                  </TableBody>
                </Table>
              </TableScroll>
            )}
          </CardContent>
        </Card>
      </PageContainer>
    </>
  );
}
