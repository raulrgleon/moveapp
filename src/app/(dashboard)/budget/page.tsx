"use client";

import { useEffect, useState } from "react";
import { DashboardHeader } from "@/components/layout/dashboard-header";
import { useT } from "@/contexts/locale-context";
import { MOVE_PROFILE_UPDATED } from "@/lib/move/profile-events";
import { PageContainer } from "@/components/dashboard/page-container";
import { PageHeader } from "@/components/dashboard/page-header";
import { TableScroll } from "@/components/dashboard/table-scroll";
import { StatCard } from "@/components/dashboard/stat-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { DollarSign, PiggyBank, RefreshCw, TrendingDown } from "lucide-react";

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
}

export default function BudgetPage() {
  const t = useT();
  const [data, setData] = useState<BudgetResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/api/budget");
      setData((await res.json()) as BudgetResponse);
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
    const reload = () => void load();
    window.addEventListener(MOVE_PROFILE_UPDATED, reload);
    return () => window.removeEventListener(MOVE_PROFILE_UPDATED, reload);
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

  const items = data?.items ?? [];
  const totalEstimated = data?.totalEstimated ?? 0;
  const totalActual = data?.totalActual ?? 0;
  const difference = totalEstimated - totalActual;

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
                      const diff = item.estimated - item.actual;
                      return (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.category}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.estimated)}</TableCell>
                          <TableCell className="text-right">
                            {item.actual > 0 ? formatCurrency(item.actual) : "—"}
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
