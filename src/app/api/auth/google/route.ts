import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import {
  COOKIE_NAME,
  createSession,
  sessionCookieOptions,
} from "@/lib/auth/session";
import { buildDefaultMoveData } from "@/lib/db/move-service";

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  if (!clientId) {
    return NextResponse.json({ error: "Google OAuth not configured" }, { status: 503 });
  }

  const base = process.env.NEXT_PUBLIC_APP_URL || `${req.nextUrl.protocol}//${req.nextUrl.host}`;
  const redirectUri = `${base}/api/auth/google/callback`;
  const state = randomUUID();

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
  });

  const res = NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
  res.cookies.set("oauth_state", state, { httpOnly: true, path: "/", maxAge: 600 });
  return res;
}

export async function POST() {
  return NextResponse.json({ error: "Use GET" }, { status: 405 });
}
