"use client";

import Link from "next/link";
import { ArrowRight, Check, Minus, Sparkles } from "lucide-react";
import { useT } from "@/contexts/locale-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const PRO_FEATURES = [
  "pricing.proFeature1",
  "pricing.proFeature2",
  "pricing.proFeature3",
  "pricing.proFeature4",
  "pricing.proFeature5",
  "pricing.proFeature6",
] as const;

const FREE_FEATURES = [
  "pricing.freeFeature1",
  "pricing.freeFeature2",
  "pricing.freeFeature3",
  "pricing.freeFeature4",
] as const;

const COMPARE_ROWS: Array<
  | { labelKey: string; freeKey: string; proKey: string }
  | { labelKey: string; free: false; pro: true }
> = [
  { labelKey: "pricing.comparePilot", freeKey: "pricing.comparePilotFree", proKey: "pricing.comparePilotPro" },
  { labelKey: "pricing.compareRoute", freeKey: "pricing.compareRouteFree", proKey: "pricing.compareRoutePro" },
  { labelKey: "pricing.compareBudget", freeKey: "pricing.compareBudgetFree", proKey: "pricing.compareBudgetPro" },
  { labelKey: "pricing.compareChecklist", freeKey: "pricing.compareChecklistFree", proKey: "pricing.compareChecklistPro" },
  { labelKey: "pricing.compareShare", free: false, pro: true },
  { labelKey: "pricing.compareReminders", free: false, pro: true },
  { labelKey: "pricing.compareSupport", free: false, pro: true },
];

type PricingPlansSectionProps = {
  variant?: "full" | "compact";
  className?: string;
};

export function PricingPlansSection({ variant = "full", className }: PricingPlansSectionProps) {
  const t = useT();
  const compact = variant === "compact";

  return (
    <div className={cn("space-y-10", className)}>
      <div
        className={cn(
          "grid gap-6 mx-auto items-stretch",
          compact ? "max-w-4xl md:grid-cols-2" : "max-w-5xl lg:grid-cols-[0.92fr_1.08fr]"
        )}
      >
        {/* Pro — first on mobile, dominant on desktop */}
        <Card
          className={cn(
            "relative order-1 lg:order-2 overflow-hidden",
            "border-primary bg-gradient-to-b from-primary/[0.06] to-card",
            "shadow-xl shadow-primary/15 ring-1 ring-primary/20",
            !compact && "lg:-my-2 lg:scale-[1.02]"
          )}
        >
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-brand-blue via-primary to-brand-accent" />
          <div className="absolute top-4 right-4 flex flex-wrap gap-2 justify-end max-w-[60%]">
            <Badge className="bg-primary text-primary-foreground shadow-sm">
              {t("pricing.recommended")}
            </Badge>
            <Badge variant="secondary" className="border-primary/20 bg-background/90">
              <Sparkles className="h-3 w-3 mr-1" />
              {t("pricing.trialBadge")}
            </Badge>
          </div>
          <CardHeader className={cn("pb-2", compact ? "pt-8" : "pt-10 sm:pt-12")}>
            <CardTitle className="font-display text-2xl sm:text-3xl">{t("pricing.proName")}</CardTitle>
            <CardDescription className="text-base">{t("pricing.proDesc")}</CardDescription>
            <div className="pt-5 space-y-1">
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-4xl sm:text-5xl font-bold tracking-tight">{t("pricing.proPrice")}</span>
                <span className="text-muted-foreground text-lg">{t("pricing.proPeriod")}</span>
              </div>
              <p className="text-sm font-medium text-primary">{t("pricing.proTrialLine")}</p>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <ul className="space-y-3 text-sm">
              {PRO_FEATURES.map((key) => (
                <li key={key} className="flex gap-2.5">
                  <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" strokeWidth={2.5} />
                  <span>{t(key)}</span>
                </li>
              ))}
            </ul>
            <Button size={compact ? "default" : "lg"} className="w-full shadow-md shadow-primary/20" asChild>
              <Link href="/onboarding">
                {t("pricing.proCta")}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <p className="text-xs text-center text-muted-foreground">{t("pricing.proFootnote")}</p>
          </CardContent>
        </Card>

        {/* Free — preview tier, visually subdued */}
        <Card
          className={cn(
            "order-2 lg:order-1 border-dashed border-muted-foreground/25 bg-muted/20",
            "opacity-95 lg:mt-4"
          )}
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="font-display text-xl text-muted-foreground">
                {t("pricing.freeName")}
              </CardTitle>
              <Badge variant="outline" className="text-muted-foreground font-normal">
                {t("pricing.previewBadge")}
              </Badge>
            </div>
            <CardDescription>{t("pricing.freeDesc")}</CardDescription>
            <div className="pt-4 flex items-baseline gap-1">
              <span className="text-3xl font-bold text-muted-foreground">{t("pricing.freePrice")}</span>
              <span className="text-muted-foreground">{t("pricing.freePeriod")}</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <ul className="space-y-3 text-sm text-muted-foreground">
              {FREE_FEATURES.map((key) => (
                <li key={key} className="flex gap-2.5">
                  <Minus className="h-4 w-4 shrink-0 mt-0.5 opacity-50" />
                  <span>{t(key)}</span>
                </li>
              ))}
            </ul>
            <Button variant="ghost" className="w-full text-muted-foreground" asChild>
              <Link href="/onboarding">{t("pricing.freeCta")}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {!compact && (
        <div className="max-w-5xl mx-auto overflow-x-auto rounded-xl border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/40">
                <th className="text-left p-4 font-medium">{t("pricing.compareTitle")}</th>
                <th className="p-4 font-medium text-muted-foreground w-[28%]">{t("pricing.freeName")}</th>
                <th className="p-4 font-medium text-primary w-[28%]">{t("pricing.proName")}</th>
              </tr>
            </thead>
            <tbody>
              {COMPARE_ROWS.map((row) => (
                <tr key={row.labelKey} className="border-b last:border-0">
                  <td className="p-4 font-medium">{t(row.labelKey)}</td>
                  <td className="p-4 text-muted-foreground">
                    {"freeKey" in row ? (
                      t(row.freeKey)
                    ) : (
                      <Minus className="h-4 w-4 text-muted-foreground/50" />
                    )}
                  </td>
                  <td className="p-4">
                    {"proKey" in row ? (
                      <span className="font-medium">{t(row.proKey)}</span>
                    ) : (
                      <Check className="h-4 w-4 text-primary" strokeWidth={2.5} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-center text-sm text-muted-foreground max-w-2xl mx-auto">
        {t("pricing.stripeNote")}
      </p>
    </div>
  );
}
