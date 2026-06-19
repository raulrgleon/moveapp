"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { useLocale, useT } from "@/contexts/locale-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { isUpgradeRequiredResponse } from "@/lib/api-client";
import { showPaywallModal } from "@/lib/billing/paywall-bridge";

const QUICK_KEYS = ["pilotQuick1", "pilotQuick2", "pilotQuick3", "pilotQuick4"] as const;

export function InventoryPilotPanel() {
  const t = useT();
  const { locale } = useLocale();
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wasLoadingRef = useRef(false);

  const focusInput = useCallback(() => {
    requestAnimationFrame(() => {
      inputRef.current?.focus({ preventScroll: true });
    });
  }, []);

  useEffect(() => {
    if (wasLoadingRef.current && !loading) {
      focusInput();
    }
    wasLoadingRef.current = loading;
  }, [loading, focusInput]);

  const ask = async (text: string) => {
    const q = text.trim();
    if (!q || loading) return;
    setLoading(true);
    setAnswer(null);
    try {
      const res = await fetch("/api/inventory/assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ question: q, locale }),
      });
      if (isUpgradeRequiredResponse(res)) {
        let trialExpired = false;
        let trialDaysLeft = 0;
        try {
          const json = (await res.json()) as {
            trialExpired?: boolean;
            trialDaysLeft?: number;
          };
          trialExpired = Boolean(json.trialExpired);
          trialDaysLeft = json.trialDaysLeft ?? 0;
        } catch {
          /* ignore */
        }
        showPaywallModal({
          trialExpired,
          trialDaysLeft,
          returnTo: window.location.pathname + window.location.search,
        });
        return;
      }
      if (!res.ok) throw new Error("failed");
      const data = (await res.json()) as { answer: string };
      setAnswer(data.answer);
    } catch {
      setAnswer(t("chat.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          {t("inventory.pilotTitle")}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {QUICK_KEYS.map((key) => (
            <button
              key={key}
              type="button"
              disabled={loading}
              onClick={() => {
                const q = t(`inventory.${key}`);
                setQuestion(q);
                void ask(q);
              }}
              className="rounded-full border bg-background px-2.5 py-1 text-xs text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
            >
              {t(`inventory.${key}`)}
            </button>
          ))}
        </div>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void ask(question);
          }}
        >
          <Input
            ref={inputRef}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder={t("inventory.pilotPlaceholder")}
            disabled={loading}
          />
          <Button type="submit" disabled={loading || !question.trim()}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t("inventory.pilotAsk")}
          </Button>
        </form>
        {loading && !answer && (
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            {t("inventory.pilotThinking")}
          </p>
        )}
        {answer && (
          <div className="rounded-lg bg-muted/50 p-3 text-sm whitespace-pre-wrap">{answer}</div>
        )}
      </CardContent>
    </Card>
  );
}
