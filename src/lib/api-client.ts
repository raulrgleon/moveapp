"use client";

function parseApiError(text: string, status: number): Error {
  try {
    const json = JSON.parse(text) as { error?: string };
    if (json.error) return new Error(json.error);
  } catch {
    /* not JSON */
  }
  return new Error(text || `Request failed: ${status}`);
}

/** Redirect to upgrade when the API returns 402 / UPGRADE_REQUIRED. */
export function redirectToUpgrade(): void {
  if (typeof window === "undefined") return;
  const returnTo = window.location.pathname + window.location.search;
  const suffix =
    returnTo && returnTo !== "/upgrade"
      ? `?returnTo=${encodeURIComponent(returnTo)}`
      : "";
  window.location.href = `/upgrade${suffix}`;
}

export function isUpgradeRequiredResponse(res: Response): boolean {
  return res.status === 402;
}

export async function apiFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(path, { ...init, headers, credentials: "include" });
  if (res.status === 401) throw new Error("Not authenticated");
  if (isUpgradeRequiredResponse(res)) {
    redirectToUpgrade();
    throw new Error("Pro subscription required");
  }
  if (!res.ok) {
    const text = await res.text();
    throw parseApiError(text, res.status);
  }
  return res;
}
