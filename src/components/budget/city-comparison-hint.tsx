"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, TrendingDown, TrendingUp } from "lucide-react";
import { useMove } from "@/contexts/move-context";
import { useT } from "@/contexts/locale-context";
import type { CityComparisonResponse } from "@/lib/city-comparison/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function CityComparisonHint() {
  const t = useT();
  const { profile } = useMove();
  const [data, setData] = useState<CityComparisonResponse | null>(null);

  useEffect(() => {
    if (!profile.origin?.trim() || !profile.destination?.trim()) return;
    void (async () => {
      try {
        const params = new URLSearchParams({
          origin: profile.origin,
          destination: profile.destination,
        });
        const res = await fetch(`/api/city-comparison?${params}`);
        if (!res.ok) return;
        setData((await res.json()) as CityComparisonResponse);
      } catch {
        /* ignore */
      }
    })();
  }, [profile.origin, profile.destination]);

  const message = useMemo(() => {
    if (!data?.verdict) return null;
    const city = profile.destination.split(",")[0]?.trim() || profile.destination;
    if (data.verdict.overall === "better") {
      return t("cityComparison.verdictBetter", { city });
    }
    if (data.verdict.overall === "worse") {
      return t("cityComparison.verdictWorse", { city });
    }
    return t("cityComparison.verdictMixed", { city });
  }, [data, profile.destination, t]);

  if (!message) return null;

  const cheaper = data?.verdict?.overall === "better";

  return (
    <Card className="border-dashed">
      <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 text-sm">
        {cheaper ? (
          <TrendingDown className="h-5 w-5 text-emerald-600 shrink-0" />
        ) : (
          <TrendingUp className="h-5 w-5 text-amber-600 shrink-0" />
        )}
        <p className="flex-1 text-muted-foreground">{message}</p>
        <Button variant="outline" size="sm" asChild>
          <Link href="/city-comparison">
            {t("budget.viewCityComparison")}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
