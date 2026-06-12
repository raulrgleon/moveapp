import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  COOKIE_NAME,
  createSession,
  isSecureRequest,
  sessionCookieOptions,
} from "@/lib/auth/session";
import { buildDefaultMoveData } from "@/lib/db/move-service";

export async function GET(req: NextRequest) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const base = process.env.NEXT_PUBLIC_APP_URL || `${req.nextUrl.protocol}//${req.nextUrl.host}`;
  const redirectUri = `${base}/api/auth/google/callback`;

  if (!clientId || !clientSecret) {
    return NextResponse.redirect(`${base}/login?error=oauth`);
  }

  const state = req.nextUrl.searchParams.get("state");
  const code = req.nextUrl.searchParams.get("code");
  const savedState = req.cookies.get("oauth_state")?.value;

  if (!code || !state || state !== savedState) {
    return NextResponse.redirect(`${base}/login?error=oauth`);
  }

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    return NextResponse.redirect(`${base}/login?error=oauth`);
  }

  const tokens = (await tokenRes.json()) as { access_token: string };
  const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  if (!profileRes.ok) {
    return NextResponse.redirect(`${base}/login?error=oauth`);
  }

  const googleUser = (await profileRes.json()) as {
    id: string;
    email: string;
    name?: string;
  };

  let user = await prisma.user.findFirst({
    where: {
      OR: [{ googleId: googleUser.id }, { email: googleUser.email.toLowerCase() }],
    },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: googleUser.email.toLowerCase(),
        name: googleUser.name || googleUser.email.split("@")[0],
        googleId: googleUser.id,
        role: "user",
        moves: { create: await buildDefaultMoveData() },
      },
    });
  } else if (!user.googleId) {
    user = await prisma.user.update({
      where: { id: user.id },
      data: { googleId: googleUser.id },
    });
  }

  const { token, expiresAt } = await createSession(user.id, user.email, user.role);
  const res = NextResponse.redirect(`${base}/dashboard`);
  res.cookies.set(COOKIE_NAME, token, sessionCookieOptions(expiresAt, isSecureRequest(req)));
  res.cookies.set("oauth_state", "", { maxAge: 0, path: "/" });
  return res;
}
