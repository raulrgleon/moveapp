import { NextRequest } from "next/server";
import { findOrCreateOAuthUser } from "@/lib/auth/oauth-user";
import { getOAuthBaseUrl, isGoogleOAuthConfigured } from "@/lib/auth/oauth-providers";
import { completeOAuthLogin, oauthFailureRedirect } from "@/lib/auth/oauth-session";

const STATE_COOKIE = "oauth_state";

export async function GET(req: NextRequest) {
  if (!isGoogleOAuthConfigured()) {
    return oauthFailureRedirect(req);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID!;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
  const base = getOAuthBaseUrl(req);
  const redirectUri = `${base}/api/auth/google/callback`;

  const state = req.nextUrl.searchParams.get("state");
  const code = req.nextUrl.searchParams.get("code");
  const savedState = req.cookies.get(STATE_COOKIE)?.value;

  if (!code || !state || state !== savedState) {
    return oauthFailureRedirect(req);
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
    return oauthFailureRedirect(req);
  }

  const tokens = (await tokenRes.json()) as { access_token: string };
  const profileRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  if (!profileRes.ok) {
    return oauthFailureRedirect(req);
  }

  const googleUser = (await profileRes.json()) as {
    id: string;
    email: string;
    name?: string;
  };

  try {
    const { user, isNewUser } = await findOrCreateOAuthUser({
      provider: "google",
      providerId: googleUser.id,
      email: googleUser.email,
      name: googleUser.name,
    });

    return completeOAuthLogin(req, user, isNewUser, STATE_COOKIE);
  } catch {
    return oauthFailureRedirect(req);
  }
}
