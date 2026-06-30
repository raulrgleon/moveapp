"use client";

import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { CLIENT_BUILD_ID_KEY } from "@/lib/app-version-client";
import { useT } from "@/contexts/locale-context";
import { Button } from "@/components/ui/button";

const CHECK_INTERVAL_MS = 60 * 1000;

async function fetchBuildId(): Promise<string | null> {
  try {
    const res = await fetch("/api/app-version", { cache: "no-store" });
    if (!res.ok) return null;
    const json = (await res.json()) as { buildId?: string };
    return json.buildId ?? null;
  } catch {
    return null;
  }
}

/** Prompt reload when a new deploy is detected (common on mobile/PWA cache). */
export function DeployReloadPrompt() {
  const t = useT();
  const [show, setShow] = useState(false);
  const [serverBuildId, setServerBuildId] = useState<string | null>(null);

  const checkVersion = useCallback(async () => {
    const remote = await fetchBuildId();
    if (!remote) return;

    const stored = localStorage.getItem(CLIENT_BUILD_ID_KEY);
    if (!stored) {
      localStorage.setItem(CLIENT_BUILD_ID_KEY, remote);
      return;
    }

    if (stored !== remote) {
      setServerBuildId(remote);
      setShow(true);
      // Refresh in background after short delay to recover stale clients,
      // while still giving users a visible prompt first.
      window.setTimeout(() => {
        localStorage.setItem(CLIENT_BUILD_ID_KEY, remote);
        window.location.reload();
      }, 12_000);
    }
  }, []);

  useEffect(() => {
    void checkVersion();

    const onVisible = () => {
      if (document.visibilityState === "visible") void checkVersion();
    };
    document.addEventListener("visibilitychange", onVisible);

    const interval = window.setInterval(() => void checkVersion(), CHECK_INTERVAL_MS);
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      window.clearInterval(interval);
    };
  }, [checkVersion]);

  const reload = () => {
    if (serverBuildId) {
      localStorage.setItem(CLIENT_BUILD_ID_KEY, serverBuildId);
    }
    window.location.reload();
  };

  if (!show) return null;

  return (
    <div
      role="status"
      className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom,0px))] left-3 right-3 z-[60] lg:bottom-6 lg:left-auto lg:right-6 lg:max-w-sm rounded-xl border border-primary/30 bg-background/95 backdrop-blur shadow-lg p-4 animate-fade-in"
    >
      <p className="text-sm font-medium">{t("common.updateAvailable")}</p>
      <p className="text-xs text-muted-foreground mt-1">{t("common.updateAvailableHint")}</p>
      <Button size="sm" className="mt-3 w-full gap-2" onClick={reload}>
        <RefreshCw className="h-4 w-4" />
        {t("common.reloadApp")}
      </Button>
    </div>
  );
}
