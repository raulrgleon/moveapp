"use client";

import { useEffect, useState } from "react";
import { Calendar, DollarSign, MapPin, Truck } from "lucide-react";
import { useLocale, useT } from "@/contexts/locale-context";
import { formatCurrency, formatDate } from "@/lib/utils";

interface PlanShareData {
  ownerName: string;
  origin: string;
  destination: string;
  moveDate: string;
  truckChoice: string | null;
  distanceMiles: number;
  driveTimeLabel: string | null;
  items: { category: string; estimated: number; cheapestOption?: string | null }[];
  totalEstimated: number;
  budgetTarget: number;
}

export default function PublicPlanPage({ params }: { params: { token: string } }) {
  const t = useT();
  const { locale } = useLocale();
  const [data, setData] = useState<PlanShareData | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const res = await fetch(`/api/plan/${params.token}`);
        if (!res.ok) {
          setError(true);
          return;
        }
        setData((await res.json()) as PlanShareData);
      } catch {
        setError(true);
      }
    })();
  }, [params.token]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <p className="text-muted-foreground">{t("publicPlan.unavailable")}</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <p className="text-muted-foreground">{t("common.loading")}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <header className="text-center space-y-2">
          <p className="text-sm text-muted-foreground">{t("publicPlan.sharedPlan")}</p>
          <h1 className="text-2xl font-bold">
            {t("publicPlan.moveTitle", { name: data.ownerName })}
          </h1>
          <p className="text-muted-foreground flex items-center justify-center gap-2">
            <MapPin className="h-4 w-4" />
            {data.origin} → {data.destination}
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border bg-card p-4 text-center">
            <Calendar className="h-5 w-5 mx-auto text-primary mb-2" />
            <p className="text-xs text-muted-foreground">{t("publicPlan.moveDate")}</p>
            <p className="font-semibold">{formatDate(data.moveDate, locale)}</p>
          </div>
          <div className="rounded-xl border bg-card p-4 text-center">
            <MapPin className="h-5 w-5 mx-auto text-primary mb-2" />
            <p className="text-xs text-muted-foreground">{t("publicPlan.route")}</p>
            <p className="font-semibold">{data.distanceMiles.toLocaleString()} mi</p>
            {data.driveTimeLabel && (
              <p className="text-xs text-muted-foreground">{data.driveTimeLabel}</p>
            )}
          </div>
          <div className="rounded-xl border bg-card p-4 text-center">
            <DollarSign className="h-5 w-5 mx-auto text-primary mb-2" />
            <p className="text-xs text-muted-foreground">{t("publicPlan.estimatedTotal")}</p>
            <p className="font-semibold">{formatCurrency(data.totalEstimated)}</p>
          </div>
        </div>

        {data.truckChoice && (
          <div className="rounded-xl border bg-card p-4 flex items-center gap-3">
            <Truck className="h-5 w-5 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">{t("publicPlan.truckChoice")}</p>
              <p className="font-medium">{data.truckChoice}</p>
            </div>
          </div>
        )}

        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="p-4 border-b font-medium">{t("publicPlan.budgetBreakdown")}</div>
          <ul className="divide-y">
            {data.items.map((item) => (
              <li key={item.category} className="flex justify-between p-4 text-sm">
                <span>{item.category}</span>
                <span className="font-medium">{formatCurrency(item.estimated)}</span>
              </li>
            ))}
          </ul>
          <div className="flex justify-between p-4 bg-muted/40 font-semibold">
            <span>{t("publicPlan.totalEstimated")}</span>
            <span>{formatCurrency(data.totalEstimated)}</span>
          </div>
        </div>

        <p className="text-xs text-center text-muted-foreground">{t("publicPlan.footer")}</p>
      </div>
    </div>
  );
}
