const OPEN_PILOT_EVENT = "movepilot:open-pilot";

export function openPilotChat() {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent(OPEN_PILOT_EVENT));
}

export function subscribeOpenPilot(listener: () => void) {
  if (typeof window === "undefined") return () => undefined;
  window.addEventListener(OPEN_PILOT_EVENT, listener);
  return () => window.removeEventListener(OPEN_PILOT_EVENT, listener);
}
