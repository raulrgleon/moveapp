/** Browser mutations stay on the configured app; provider hooks authenticate separately. */
export function mutationOriginAllowed(method: string, pathname: string, origin: string | null, configured: string[]): boolean {
  if (["GET", "HEAD", "OPTIONS"].includes(method)) return true;
  if (method === "POST" && ["/api/billing/webhook", "/api/cron/reminders"].includes(pathname)) return true;
  if (method === "POST" && pathname === "/api/auth/apple/callback" && origin === "https://appleid.apple.com") return true;
  if (!origin) return false;
  try {
    const parsed = new URL(origin);
    if (origin !== parsed.origin || !["https:", "http:"].includes(parsed.protocol)) return false;
    return configured.some((value) => new URL(value).origin === origin);
  } catch { return false; }
}
