"use client";

import { useEffect, useState } from "react";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { useMove } from "@/contexts/move-context";
import { useT } from "@/contexts/locale-context";
import { subscribeProfileUpdated } from "@/lib/move/refresh-data";
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
import { apiFetch } from "@/lib/api-client";
import { formatCurrency } from "@/lib/utils";
import { AlertTriangle, DollarSign, PiggyBank, RefreshCw, TrendingDown } from "lucide-react";

interface BudgetItemRow {
  id: string;
  category: string;
  estimated: number;
  actual: number;
  cheapestOption?: string | null;
}

interface BudgetResponse {
  items: BudgetItemRow[];
  totalEstimated: number;
  totalActual: number;
  notes: string[];
  distanceMiles?: number;
  isEstimate?: boolean;
}

export default function BudgetPage() {
  const t = useT();
  const { truckChoice } = useMove();
  const [data, setData] = useState<BudgetResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [draftActuals, setDraftActuals] = useState<Record<string, string>>({});

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/budget");
      const json = (await res.json()) as BudgetResponse;
      setData(json);
      const drafts: Record<string, string> = {};
      json.items.forEach((item) => {
        drafts[item.id] = item.actual > 0 ? String(item.actual) : "";
      });
      setDraftActuals(drafts);
    } catch {
      setData({ items: [], totalEstimated: 0, totalActual: 0, notes: [] });
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
    try {
      const res = await apiFetch("/api/budget", {
        method: "PATCH",
        body: JSON.stringify({ recalculate: true }),
      });
      setData((await res.json()) as BudgetResponse);
    } finally {
      setRecalculating(false);
    }
  };

  const saveActual = async (item: BudgetItemRow) => {
    const raw = draftActuals[item.id] ?? "";
    const actual = raw === "" ? 0 : Number(raw);
    if (!Number.isFinite(actual) || actual < 0) return;

    setSavingId(item.id);
    try {
      const res = await apiFetch("/api/budget", {
        method: "PATCH",
        body: JSON.stringify({ items: [{ id: item.id, actual }] }),
      });
      setData((await res.json()) as BudgetResponse);
    } finally {
      setSavingId(null);
    }
  };

  const items = data?.items ?? [];
  const totalEstimated = data?.totalEstimated ?? 0;
  const totalActual = data?.totalActual ?? 0;
  const difference = totalEstimated - totalActual;
  const isOverBudget = totalActual > totalEstimated && totalActual > 0;
  const chartMax = Math.max(totalEstimated, totalActual, 1);

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
          <CardContent className="p-4 text-sm text-muted-foreground">
            {data?.distanceMiles
              ? t("budget.estimateBannerMiles", { miles: data.distanceMiles.toLocaleString() })
              : t("budget.estimateBanner")}
          </CardContent>
        </Card>

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

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
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
                      <TableHead className="text-right">{t("budget.difference")}</TableHead>
                      <TableHead>{t("budget.cheapest")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item) => {
                      const actualVal = Number(draftActuals[item.id] ?? 0) || item.actual;
                      const diff = item.estimated - actualVal;
                      return (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.category}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.estimated)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Input
                                type="number"
                                min={0}
                                className="w-24 h-8 text-right"
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
                                className="h-8"
                                disabled={savingId === item.id}
                                onClick={() => saveActual(item)}
                              >
                                {savingId === item.id ? t("common.saving") : t("budget.saveActual")}
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell className="text-right text-emerald-600">
                            {diff > 0 ? formatCurrency(diff) : "—"}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground max-w-[200px]">
                            {item.cheapestOption ?? "—"}
                          </TableCell>
                        </TableRow>
                      );
                    })}
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
