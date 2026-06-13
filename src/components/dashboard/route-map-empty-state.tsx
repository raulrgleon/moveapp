"use client";

import Link from "next/link";
import { MapPin } from "lucide-react";
import { useT } from "@/contexts/locale-context";
import { Button } from "@/components/ui/button";

export function RouteMapEmptyState({ className }: { className?: string }) {
  const t = useT();

  return (
    <div
      className={`flex min-h-[280px] sm:min-h-[360px] flex-col items-center justify-center rounded-xl border border-dashed bg-muted/30 px-6 text-center ${className ?? ""}`}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
        <MapPin className="h-6 w-6 text-primary" />
      </div>
      <p className="mt-4 font-medium">{t("routePage.mapEmptyTitle")}</p>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{t("routePage.mapEmptyDesc")}</p>
      <Button asChild size="sm" className="mt-4">
        <Link href="/settings">{t("routePage.mapEmptyAction")}</Link>
      </Button>
    </div>
  );
}
