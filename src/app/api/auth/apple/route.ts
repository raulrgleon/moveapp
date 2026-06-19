import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getOAuthBaseUrl, isAppleOAuthConfigured } from "@/lib/auth/oauth-providers";

const STATE_COOKIE = "oauth_state_apple";

export async function GET(req: NextRequest) {
  if (!isAppleOAuthConfigured()) {
    return NextResponse.json({ error: "Apple Sign In not configured" }, { status: 503 });
  }

  const clientId = process.env.APPLE_CLIENT_ID!;
  const base = getOAuthBaseUrl(req);
  const redirectUri = `${base}/api/auth/apple/callback`;
  const state = randomUUID();

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    response_mode: "form_post",
    scope: "name email",
    state,
  });

  const res = NextResponse.redirect(`https://appleid.apple.com/auth/authorize?${params}`);
  res.cookies.set(STATE_COOKIE, state, { httpOnly: true, path: "/", maxAge: 600, sameSite: "lax" });
  return res;
}

export async function POST() {
  return NextResponse.json({ error: "Use GET" }, { status: 405 });
}
