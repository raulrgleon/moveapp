"use client";

import { invalidateUserData, loadUserData, type UserDataPayload } from "@/lib/data-cache";
import { dispatchProfileUpdated } from "@/lib/move/profile-events";

/** Invalidate cache, reload from API, and notify all subscribers. */
export async function refreshMoveData(email: string): Promise<UserDataPayload> {
  invalidateUserData();
  const data = await loadUserData(email.trim().toLowerCase(), true);
  dispatchProfileUpdated();
  return data;
}

export function subscribeProfileUpdated(handler: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("movepilot:profile-updated", handler);
  return () => window.removeEventListener("movepilot:profile-updated", handler);
}
