import { NextRequest } from "next/server";
import {
  exchangeAppleAuthorizationCode,
  parseAppleUserName,
  verifyAppleIdToken,
} from "@/lib/auth/apple-oauth";
import { findOrCreateOAuthUser } from "@/lib/auth/oauth-user";
import { getOAuthBaseUrl, isAppleOAuthConfigured } from "@/lib/auth/oauth-providers";
import { completeOAuthLogin, oauthFailureRedirect } from "@/lib/auth/oauth-session";

const STATE_COOKIE = "oauth_state_apple";

export async function POST(req: NextRequest) {
  if (!isAppleOAuthConfigured()) {
    return oauthFailureRedirect(req);
  }

  const base = getOAuthBaseUrl(req);
  const redirectUri = `${base}/api/auth/apple/callback`;

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return oauthFailureRedirect(req);
  }

  const code = form.get("code")?.toString();
  const state = form.get("state")?.toString();
  const savedState = req.cookies.get(STATE_COOKIE)?.value;
  const error = form.get("error")?.toString();

  if (error || !code || !state || state !== savedState) {
    return oauthFailureRedirect(req);
  }

  try {
    const idToken = await exchangeAppleAuthorizationCode(code, redirectUri);
    const profile = await verifyAppleIdToken(idToken);
    const appleName = parseAppleUserName(form.get("user")?.toString());

    const { user, isNewUser } = await findOrCreateOAuthUser({
      provider: "apple",
      providerId: profile.sub,
      email: profile.email ?? null,
      name: appleName,
    });

    return completeOAuthLogin(req, user, isNewUser, STATE_COOKIE);
  } catch (err) {
    if (err instanceof Error && err.message === "OAUTH_EMAIL_REQUIRED") {
      return oauthFailureRedirect(req);
    }
    return oauthFailureRedirect(req);
  }
}
