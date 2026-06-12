export const MOVE_PROFILE_UPDATED = "movepilot:profile-updated";

export function dispatchProfileUpdated() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(MOVE_PROFILE_UPDATED));
}
