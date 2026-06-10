"use client";

import { DashboardHeader } from "@/components/layout/dashboard-header";
import { useT } from "@/contexts/locale-context";
import { PageContainer } from "@/components/dashboard/page-container";
import { PageHeader } from "@/components/dashboard/page-header";
import { TableScroll } from "@/components/dashboard/table-scroll";
import { StatCard } from "@/components/dashboard/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BUDGET_ITEMS } from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";
import { DollarSign, PiggyBank, TrendingDown } from "lucide-react";

export default function BudgetPage() {
  const t = useT();
  const totalEstimated = BUDGET_ITEMS.reduce((sum, item) => sum + item.estimated, 0);
  const totalActual = BUDGET_ITEMS.reduce((sum, item) => sum + item.actual, 0);
  const difference = totalEstimated - totalActual;

  return (
    <>
      <DashboardHeader title={t("budget.title")} description={t("budget.subtitle")} />
      <PageContainer>
        <PageHeader title={t("budget.pageTitle")} description={t("budget.pageDesc")} />

        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard
            label="Estimated total"
            value={formatCurrency(totalEstimated)}
            icon={DollarSign}
          />
          <StatCard
            label="Actual spent"
            value={formatCurrency(totalActual)}
            subtext="237 spent so far"
            icon={PiggyBank}
          />
          <StatCard
            label="Remaining"
            value={formatCurrency(difference)}
            subtext="Under budget"
            icon={TrendingDown}
          />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Expense breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <TableScroll>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Estimated</TableHead>
                  <TableHead className="text-right">Actual</TableHead>
                  <TableHead className="text-right">Difference</TableHead>
                  <TableHead>Cheapest option</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {BUDGET_ITEMS.map((item) => {
                  const diff = item.estimated - item.actual;
                  return (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.category}</TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.estimated)}
                      </TableCell>
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
                  <TableCell>Total</TableCell>
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
          </CardContent>
        </Card>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {BUDGET_ITEMS.slice(0, 8).map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4">
                <p className="text-xs text-muted-foreground">{item.category}</p>
                <p className="mt-1 text-lg font-semibold">{formatCurrency(item.estimated)}</p>
                {item.cheapestOption && (
                  <p className="mt-2 text-xs text-muted-foreground line-clamp-2">
                    {item.cheapestOption}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </PageContainer>
    </>
  );
}
