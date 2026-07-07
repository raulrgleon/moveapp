import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

export function clientIp(req: NextRequest): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip")?.trim() ||
    "unknown"
  );
}

export async function enforcePublicRateLimit(
  req: NextRequest,
  bucket: string,
  limit = 60,
  windowMs = 60_000
): Promise<NextResponse | null> {
  const ip = clientIp(req);
  const result = await rateLimit(`public:${bucket}:${ip}`, limit, windowMs);
  if (result.ok) return null;

  const headers: Record<string, string> = {};
  if (result.retryAfterSec) {
    headers["Retry-After"] = String(result.retryAfterSec);
  }
  return NextResponse.json({ error: "Too many requests" }, { status: 429, headers });
}
