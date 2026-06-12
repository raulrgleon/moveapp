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

export async function apiFetch(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }

  const res = await fetch(path, { ...init, headers, credentials: "include" });
  if (res.status === 401) throw new Error("Not authenticated");
  if (!res.ok) {
    const text = await res.text();
    throw parseApiError(text, res.status);
  }
  return res;
}
