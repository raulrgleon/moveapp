import { NextRequest, NextResponse } from "next/server";
import {
  COOKIE_NAME,
  createSession,
  isSecureRequest,
  sessionCookieOptions,
} from "@/lib/auth/session";
import { getOAuthBaseUrl } from "@/lib/auth/oauth-providers";

export async function completeOAuthLogin(
  req: NextRequest,
  user: { id: string; email: string; role: string },
  isNewUser: boolean,
  stateCookieName: string
): Promise<NextResponse> {
  const base = getOAuthBaseUrl(req);
  const { token, expiresAt } = await createSession(user.id, user.email, user.role);
  const redirectPath = isNewUser ? `${base}/onboarding?complete=1` : `${base}/dashboard`;
  const res = NextResponse.redirect(redirectPath);
  res.cookies.set(COOKIE_NAME, token, sessionCookieOptions(expiresAt, isSecureRequest(req)));
  res.cookies.set(stateCookieName, "", { maxAge: 0, path: "/" });
  return res;
}

export function oauthFailureRedirect(req: NextRequest): NextResponse {
  const base = getOAuthBaseUrl(req);
  return NextResponse.redirect(`${base}/login?error=oauth`);
}
