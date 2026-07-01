"use client";

import { useEffect, useRef } from "react";
import { CLIENT_BUILD_ID_KEY } from "@/lib/app-version-client";

const VERSION_ERROR_RE =
  /Failed to find Server Action|older or newer deployment|Cannot read properties of undefined \(reading 'workers'\)|ChunkLoadError|Loading chunk [\d]+ failed|Failed to fetch dynamically imported module|Importing a module script failed/i;
const VERSION_RECOVER_ATTEMPTS_KEY = "movepilot_version_guard_attempts";
const VERSION_LAST_RECOVER_AT_KEY = "movepilot_version_guard_last_recover_at";
const MAX_RECOVER_ATTEMPTS = 3;
const RECOVER_COOLDOWN_MS = 8_000;

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

/**
 * Auto-recovers clients after deploy mismatch (stale JS bundle vs server build).
 * This prevents users from getting stuck on generic client exceptions on mobile.
 */
export function ClientVersionGuard() {
  const reloadingRef = useRef(false);

  useEffect(() => {
    // If the app mounts successfully and stays up briefly, clear previous recovery counters.
    const stableTimer = window.setTimeout(() => {
      sessionStorage.removeItem(VERSION_RECOVER_ATTEMPTS_KEY);
      sessionStorage.removeItem(VERSION_LAST_RECOVER_AT_KEY);
    }, 15_000);

    const now = () => Date.now();
    const readAttempts = () => Number(sessionStorage.getItem(VERSION_RECOVER_ATTEMPTS_KEY) ?? "0") || 0;

    const recover = async () => {
      if (reloadingRef.current) return;

      const attempts = readAttempts();
      if (attempts >= MAX_RECOVER_ATTEMPTS) return;
      const lastAt = Number(sessionStorage.getItem(VERSION_LAST_RECOVER_AT_KEY) ?? "0") || 0;
      if (lastAt > 0 && now() - lastAt < RECOVER_COOLDOWN_MS) return;

      reloadingRef.current = true;
      sessionStorage.setItem(VERSION_RECOVER_ATTEMPTS_KEY, String(attempts + 1));
      sessionStorage.setItem(VERSION_LAST_RECOVER_AT_KEY, String(now()));

      const latest = await fetchBuildId();
      if (latest) localStorage.setItem(CLIENT_BUILD_ID_KEY, latest);

      const url = new URL(window.location.href);
      url.searchParams.set("__mp_reload", String(now()));
      window.location.replace(url.toString());
    };

    const onError = (event: ErrorEvent) => {
      const detail = `${event.message ?? ""} ${event.error instanceof Error ? event.error.message : ""}`;
      if (VERSION_ERROR_RE.test(detail)) {
        void recover();
      }
    };

    const onRejection = (event: PromiseRejectionEvent) => {
      const reason =
        typeof event.reason === "string"
          ? event.reason
          : event.reason instanceof Error
            ? event.reason.message
            : JSON.stringify(event.reason ?? "");
      if (VERSION_ERROR_RE.test(reason)) {
        void recover();
      }
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.clearTimeout(stableTimer);
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
