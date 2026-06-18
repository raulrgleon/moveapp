"use client";

export async function startStripePortal(): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await fetch("/api/billing/portal", {
    method: "POST",
    credentials: "include",
  });

  const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };

  if (!res.ok) {
    return { ok: false, error: data.error || "Could not open billing portal" };
  }

  if (!data.url) {
    return { ok: false, error: "No portal URL returned" };
  }

  window.location.href = data.url;
  return { ok: true };
}
