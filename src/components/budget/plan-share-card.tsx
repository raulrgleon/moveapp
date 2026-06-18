"use client";

import { useCallback, useEffect, useState } from "react";
import { Copy, Link2, Share2 } from "lucide-react";
import { useMove } from "@/contexts/move-context";
import { useT } from "@/contexts/locale-context";
import { apiFetch } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function PlanShareCard() {
  const t = useT();
  const { canEdit } = useMove();
  const [enabled, setEnabled] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!canEdit) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch("/api/plan/share");
      const json = (await res.json()) as { enabled?: boolean; shareUrl?: string | null };
      setEnabled(json.enabled ?? false);
      setShareUrl(json.shareUrl ?? null);
    } catch {
      setError(t("budget.sharePlanLoadFailed"));
    } finally {
      setLoading(false);
    }
  }, [canEdit, t]);

  useEffect(() => {
    void load();
  }, [load]);

  const toggle = async () => {
    setError(null);
    try {
      const res = await apiFetch("/api/plan/share", {
        method: "POST",
        body: JSON.stringify({ enabled: !enabled }),
      });
      const json = (await res.json()) as { enabled?: boolean; shareUrl?: string | null };
      setEnabled(json.enabled ?? false);
      setShareUrl(json.shareUrl ?? null);
    } catch {
      setError(t("budget.sharePlanLoadFailed"));
    }
  };

  const copy = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError(t("budget.sharePlanCopyFailed"));
    }
  };

  if (!canEdit) return null;

  return (
    <Card className="border-dashed">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Share2 className="h-4 w-4 text-primary" />
          {t("budget.sharePlanTitle")}
        </div>
        <p className="text-sm text-muted-foreground">{t("budget.sharePlanDesc")}</p>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant={enabled ? "secondary" : "default"}
            disabled={loading}
            onClick={() => void toggle()}
          >
            <Link2 className="mr-2 h-4 w-4" />
            {enabled ? t("budget.sharePlanDisable") : t("budget.sharePlanEnable")}
          </Button>
          {enabled && shareUrl && (
            <Button size="sm" variant="outline" onClick={() => void copy()}>
              <Copy className="mr-2 h-4 w-4" />
              {copied ? t("common.copied") : t("budget.sharePlanCopy")}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
