"use client";

import { useEffect, useRef } from "react";
import { CLIENT_BUILD_ID_KEY } from "@/lib/app-version-client";

const VERSION_ERROR_RE =
  /Failed to find Server Action|older or newer deployment|Cannot read properties of undefined \(reading 'workers'\)/i;

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
    const recover = async () => {
      if (reloadingRef.current) return;
      reloadingRef.current = true;
      const latest = await fetchBuildId();
      if (latest) localStorage.setItem(CLIENT_BUILD_ID_KEY, latest);
      window.location.reload();
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
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return null;
}
