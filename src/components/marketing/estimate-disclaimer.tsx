"use client";

import { AlertTriangle } from "lucide-react";
import { useT } from "@/contexts/locale-context";
import { Card, CardContent } from "@/components/ui/card";

export function EstimateDisclaimer() {
  const t = useT();

  return (
    <Card className="border-amber-200/80 bg-amber-50/60 dark:border-amber-900/50 dark:bg-amber-950/20">
      <CardContent className="p-4 flex gap-3 text-sm text-amber-950 dark:text-amber-100">
        <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" aria-hidden />
        <p>{t("legal.estimateDisclaimer")}</p>
      </CardContent>
    </Card>
  );
}
