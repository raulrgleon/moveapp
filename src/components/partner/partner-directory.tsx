"use client";

import { ExternalLink, Star } from "lucide-react";
import { useLocale, useT } from "@/contexts/locale-context";
import type { PartnerDirectoryEntry } from "@/lib/partner/directory";
import { specialtyLabel } from "@/lib/partner/directory";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface PartnerDirectoryProps {
  entries: PartnerDirectoryEntry[];
}

export function PartnerDirectory({ entries }: PartnerDirectoryProps) {
  const t = useT();
  const { locale } = useLocale();

  if (!entries.length) return null;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{t("partnerPage.directoryTitle")}</CardTitle>
        <p className="text-sm text-muted-foreground">{t("partnerPage.directoryDesc")}</p>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        {entries.map((entry) => (
          <div key={entry.id} className="rounded-lg border p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <p className="font-medium text-sm">{entry.name}</p>
              {entry.rating != null && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground shrink-0">
                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                  {entry.rating.toFixed(1)}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-1">
              {entry.specialties.slice(0, 3).map((s) => (
                <Badge key={s} variant="secondary" className="text-[10px]">
                  {specialtyLabel(s, locale)}
                </Badge>
              ))}
            </div>
            {entry.usdot && (
              <p className="text-xs text-muted-foreground">USDOT {entry.usdot}</p>
            )}
            {entry.yearsInBusiness && (
              <p className="text-xs text-muted-foreground">
                {t("partnerPage.yearsInBusiness", { years: entry.yearsInBusiness })}
              </p>
            )}
            {entry.website && (
              <Button variant="link" size="sm" className="h-auto p-0 text-xs" asChild>
                <a href={entry.website} target="_blank" rel="noopener noreferrer">
                  {t("partnerPage.visitSite")}
                  <ExternalLink className="ml-1 h-3 w-3" />
                </a>
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
