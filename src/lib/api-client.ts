"use client";

import {
  redirectToUpgrade,
  showPaywallModal,
} from "@/lib/billing/paywall-bridge";
import { LOCALE_STORAGE_KEY, type Locale } from "@/lib/i18n";

function parseApiError(text: string, status: number): Error {
  try {
    const json = JSON.parse(text) as { error?: string };
    if (json.error) return new Error(json.error);
  } catch {
    /* not JSON */
  }
  return new Error(text || `Request failed: ${status}`);
}

export { redirectToUpgrade };

export function isUpgradeRequiredResponse(res: Response): boolean {
  return res.status === 402;
}

function clientLocale(): Locale | null {
  if (typeof window === "undefined") return null;
  const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
  return stored === "en" || stored === "es" ? stored : null;
}

export async function apiFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }
  const locale = clientLocale();
  if (locale && !headers.has("X-Locale")) {
    headers.set("X-Locale", locale);
  }

  const res = await fetch(path, { ...init, headers, credentials: "include" });
  if (res.status === 401) throw new Error("Not authenticated");
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
      /* body may be empty */
    }
    showPaywallModal({
      trialExpired,
      trialDaysLeft,
      returnTo:
        typeof window !== "undefined"
          ? window.location.pathname + window.location.search
          : undefined,
    });
    throw new Error("Pro subscription required");
  }
  if (!res.ok) {
    const text = await res.text();
    throw parseApiError(text, res.status);
  }
  return res;
}
