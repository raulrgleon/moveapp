"use client";

import { useState } from "react";
import { Loader2, Share2 } from "lucide-react";
import { useMove } from "@/contexts/move-context";
import { useT } from "@/contexts/locale-context";
import { apiFetch } from "@/lib/api-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function PlanShareCard() {
  const t = useT();
  const { canEdit, profile } = useMove();
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const share = async () => {
    setSharing(true);
    setError(null);
    setCopied(false);
    try {
      const res = await apiFetch("/api/plan/share", {
        method: "POST",
        body: JSON.stringify({ enabled: true }),
      });
      if (!res.ok) throw new Error("share failed");
      const json = (await res.json()) as { shareUrl?: string | null };
      const shareUrl = json.shareUrl;
      if (!shareUrl) throw new Error("no url");

      const shareTitle = t("budget.sharePlanShareTitle");
      const shareText = t("budget.sharePlanShareText", {
        origin: profile.origin,
        destination: profile.destination,
      });

      if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
        try {
          await navigator.share({ title: shareTitle, text: shareText, url: shareUrl });
          return;
        } catch (err) {
          if (err instanceof Error && err.name === "AbortError") return;
        }
      }

      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      if (err instanceof Error && err.message.toLowerCase().includes("pro subscription required")) {
        setError(t("budget.sharePlanProRequired"));
      } else {
        setError(t("budget.sharePlanFailed"));
      }
    } finally {
      setSharing(false);
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
        <Button
          size="sm"
          disabled={sharing}
          onClick={() => void share()}
          className="min-h-[40px]"
        >
          {sharing ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Share2 className="mr-2 h-4 w-4" />
          )}
          {copied ? t("budget.sharePlanCopied") : t("budget.sharePlanAction")}
        </Button>
      </CardContent>
    </Card>
  );
}
