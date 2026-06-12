import { NextRequest, NextResponse } from "next/server";
import { COOKIE_NAME, destroySession, validateSessionToken } from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (token) {
    const payload = await validateSessionToken(token);
    if (payload) await destroySession(payload.sessionId);
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE_NAME, "", { httpOnly: true, path: "/", maxAge: 0 });
  return res;
}
