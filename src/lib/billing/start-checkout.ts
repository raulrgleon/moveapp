"use client";

export async function startStripeCheckout(): Promise<{ ok: true } | { ok: false; error: string }> {
  const res = await fetch("/api/billing/checkout", {
    method: "POST",
    credentials: "include",
  });

  const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };

  if (!res.ok) {
    const err = data.error || "Checkout failed";
    if (res.status === 401) {
      return { ok: false, error: "Please log in again to upgrade." };
    }
    if (res.status === 503 && err.toLowerCase().includes("stripe")) {
      return { ok: false, error: err };
    }
    return { ok: false, error: err };
  }

  if (!data.url) {
    return { ok: false, error: "No checkout URL returned" };
  }

  window.location.href = data.url;
  return { ok: true };
}
