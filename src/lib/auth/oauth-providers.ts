export function isGoogleOAuthConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID?.trim() && process.env.GOOGLE_CLIENT_SECRET?.trim()
  );
}

export function isAppleOAuthConfigured(): boolean {
  return Boolean(
    process.env.APPLE_CLIENT_ID?.trim() &&
      process.env.APPLE_TEAM_ID?.trim() &&
      process.env.APPLE_KEY_ID?.trim() &&
      process.env.APPLE_PRIVATE_KEY?.trim()
  );
}

export function getOAuthProvidersStatus() {
  return {
    google: isGoogleOAuthConfigured(),
    apple: isAppleOAuthConfigured(),
  };
}

export function getOAuthBaseUrl(req: { nextUrl: { protocol: string; host: string } }): string {
  return process.env.NEXT_PUBLIC_APP_URL || `${req.nextUrl.protocol}//${req.nextUrl.host}`;
}
