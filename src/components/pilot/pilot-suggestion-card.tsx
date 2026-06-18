"use client";

import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { useT } from "@/contexts/locale-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export interface PilotSuggestionProps {
  titleKey?: string;
  message: string;
  actionLabelKey: string;
  onApply?: () => void | Promise<void>;
  href?: string;
  applying?: boolean;
}

export function PilotSuggestionCard({
  titleKey = "pilot.suggestionTitle",
  message,
  actionLabelKey,
  onApply,
  href,
  applying = false,
}: PilotSuggestionProps) {
  const t = useT();

  return (
    <Card className="border-primary/30 bg-gradient-to-br from-primary/5 to-transparent">
      <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="font-medium text-sm">{t(titleKey)}</p>
            <p className="text-sm text-muted-foreground mt-1">{message}</p>
          </div>
        </div>
        {href ? (
          <Button asChild size="sm" className="shrink-0">
            <Link href={href}>
              {t(actionLabelKey)}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        ) : (
          <Button size="sm" className="shrink-0" disabled={applying} onClick={() => void onApply?.()}>
            {applying ? t("common.saving") : t(actionLabelKey)}
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
