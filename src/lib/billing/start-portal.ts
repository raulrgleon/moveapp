"use client";

import { apiFetch, getClientLocale } from "@/lib/api-client";
import { translate } from "@/lib/i18n";

export async function startStripePortal(): Promise<{ ok: true } | { ok: false; error: string }> {
  const locale = getClientLocale();
  try {
    const res = await apiFetch("/api/billing/portal", { method: "POST" });
    const data = (await res.json()) as { url?: string; error?: string };

    if (!data.url) {
      return { ok: false, error: translate(locale, "billing.portalFailed") };
    }

    window.location.href = data.url;
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    return {
      ok: false,
      error: message || translate(locale, "billing.portalFailed"),
    };
  }
}
