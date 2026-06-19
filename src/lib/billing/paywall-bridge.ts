export type PaywallPayload = {
  trialExpired?: boolean;
  trialDaysLeft?: number;
  returnTo?: string;
};

type PaywallHandler = (payload: PaywallPayload) => void;

let handler: PaywallHandler | null = null;

export function registerPaywallHandler(next: PaywallHandler | null) {
  handler = next;
}

export function showPaywallModal(payload: PaywallPayload) {
  if (handler) {
    handler(payload);
    return;
  }
  redirectToUpgrade(payload.returnTo);
}

export function redirectToUpgrade(returnTo?: string): void {
  if (typeof window === "undefined") return;
  const path =
    returnTo ??
    (window.location.pathname + window.location.search);
  const suffix =
    path && path !== "/upgrade" ? `?returnTo=${encodeURIComponent(path)}` : "";
  window.location.href = `/upgrade${suffix}`;
}
