"use client";

import { useState } from "react";
import { Copy, ExternalLink, Loader2, Share2 } from "lucide-react";
import { useMove } from "@/contexts/move-context";
import { useT } from "@/contexts/locale-context";
import { apiFetch } from "@/lib/api-client";
import { Button } from "@/components/ui/button";

interface PartnerShareCardProps {
  enabled: boolean;
  shareUrl: string | null;
  onToggle: (enabled: boolean) => Promise<void>;
  onRefresh: () => Promise<void>;
  toggling?: boolean;
}

export function PartnerShareCard({
  enabled,
  shareUrl,
  onToggle,
  onRefresh,
  toggling = false,
}: PartnerShareCardProps) {
  const t = useT();
  const { profile, canEdit } = useMove();
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  const ensureLinkAndShare = async () => {
    if (!canEdit) return;
    setSharing(true);
    setCopied(false);
    try {
      let url = shareUrl;
      if (!enabled || !url) {
        const res = await apiFetch("/api/partner/share", {
          method: "POST",
          body: JSON.stringify({ enabled: true }),
        });
        if (!res.ok) throw new Error("enable failed");
        const json = (await res.json()) as { shareUrl?: string };
        url = json.shareUrl ?? null;
        await onRefresh();
      }
      if (!url) throw new Error("no url");

      const shareTitle = t("partnerPage.shareNativeTitle");
      const shareText = t("partnerPage.shareNativeText", {
        origin: profile.origin,
        destination: profile.destination,
      });

      if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
        try {
          await navigator.share({ title: shareTitle, text: shareText, url });
          return;
        } catch (err) {
          if (err instanceof Error && err.name === "AbortError") return;
        }
      }

      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2500);
    } finally {
      setSharing(false);
    }
  };

  const copyLink = async () => {
    if (!shareUrl) {
      await ensureLinkAndShare();
      return;
    }
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2500);
  };

  if (!canEdit) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {!enabled ? (
        <Button onClick={() => void onToggle(true)} disabled={toggling}>
          {t("partnerPage.enableShare")}
        </Button>
      ) : (
        <>
          <Button variant="outline" size="sm" onClick={() => void onToggle(false)} disabled={toggling}>
            {t("partnerPage.disableShare")}
          </Button>
          <Button size="sm" onClick={() => void ensureLinkAndShare()} disabled={sharing || toggling}>
            {sharing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Share2 className="mr-2 h-4 w-4" />
            )}
            {copied ? t("partnerPage.copied") : t("partnerPage.shareAction")}
          </Button>
          <Button variant="outline" size="sm" onClick={() => void copyLink()} disabled={!shareUrl}>
            <Copy className="mr-2 h-4 w-4" />
            {t("partnerPage.copyLink")}
          </Button>
          {shareUrl && (
            <Button variant="outline" size="sm" asChild>
              <a href={shareUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                {t("partnerPage.previewLink")}
              </a>
            </Button>
          )}
        </>
      )}
      {enabled && shareUrl && (
        <p className="w-full text-xs font-mono text-muted-foreground break-all">{shareUrl}</p>
      )}
    </div>
  );
}
