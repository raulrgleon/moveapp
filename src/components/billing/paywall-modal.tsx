"use client";

import Link from "next/link";
import { Crown, Sparkles } from "lucide-react";
import { useT } from "@/contexts/locale-context";
import { PRO_PRICE_USD } from "@/lib/billing/plan";
import { redirectToUpgrade, type PaywallPayload } from "@/lib/billing/paywall-bridge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type PaywallModalProps = {
  open: boolean;
  payload: PaywallPayload | null;
  onClose: () => void;
};

export function PaywallModal({ open, payload, onClose }: PaywallModalProps) {
  const t = useT();
  const expired = payload?.trialExpired ?? false;
  const daysLeft = payload?.trialDaysLeft ?? 0;

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            {expired ? t("paywall.titleExpired") : t("paywall.titleRequired")}
          </DialogTitle>
          <DialogDescription>
            {expired ? t("paywall.descExpired") : t("paywall.descRequired")}
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-lg border bg-muted/30 p-4 space-y-2 text-sm">
          {!expired && daysLeft > 0 && (
            <p className="font-medium text-primary flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 shrink-0" />
              {t("paywall.trialDaysLeft", { days: daysLeft })}
            </p>
          )}
          <p className="text-muted-foreground">{t("paywall.perkHint")}</p>
        </div>

        <DialogFooter className="flex-col sm:flex-col gap-2">
          <Button
            className="w-full"
            onClick={() => redirectToUpgrade(payload?.returnTo)}
          >
            {t("paywall.upgradeCta", { price: `$${PRO_PRICE_USD}` })}
          </Button>
          <Button variant="outline" className="w-full" onClick={onClose}>
            {t("paywall.continueBrowsing")}
          </Button>
          <Button variant="link" className="w-full text-muted-foreground" asChild>
            <Link href="/upgrade" onClick={onClose}>
              {t("upgrade.viewDetails")}
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
