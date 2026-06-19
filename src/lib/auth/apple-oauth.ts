import { SignJWT, createRemoteJWKSet, importPKCS8, jwtVerify } from "jose";

const APPLE_ISSUER = "https://appleid.apple.com";
const APPLE_JWKS = createRemoteJWKSet(new URL(`${APPLE_ISSUER}/auth/keys`));

function getApplePrivateKeyPem(): string {
  const raw = process.env.APPLE_PRIVATE_KEY ?? "";
  return raw.replace(/\\n/g, "\n").trim();
}

export async function createAppleClientSecret(clientId: string): Promise<string> {
  const teamId = process.env.APPLE_TEAM_ID!;
  const keyId = process.env.APPLE_KEY_ID!;
  const privateKey = await importPKCS8(getApplePrivateKeyPem(), "ES256");

  return new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: keyId })
    .setIssuer(teamId)
    .setIssuedAt()
    .setExpirationTime("180d")
    .setAudience(APPLE_ISSUER)
    .setSubject(clientId)
    .sign(privateKey);
}

export async function exchangeAppleAuthorizationCode(
  code: string,
  redirectUri: string
): Promise<string> {
  const clientId = process.env.APPLE_CLIENT_ID!;
  const clientSecret = await createAppleClientSecret(clientId);

  const tokenRes = await fetch(`${APPLE_ISSUER}/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
    }),
  });

  if (!tokenRes.ok) {
    throw new Error("APPLE_TOKEN_EXCHANGE_FAILED");
  }

  const tokens = (await tokenRes.json()) as { id_token?: string };
  if (!tokens.id_token) {
    throw new Error("APPLE_ID_TOKEN_MISSING");
  }

  return tokens.id_token;
}

export async function verifyAppleIdToken(idToken: string): Promise<{
  sub: string;
  email?: string;
}> {
  const clientId = process.env.APPLE_CLIENT_ID!;
  const { payload } = await jwtVerify(idToken, APPLE_JWKS, {
    issuer: APPLE_ISSUER,
    audience: clientId,
  });

  return {
    sub: payload.sub as string,
    email: typeof payload.email === "string" ? payload.email : undefined,
  };
}

export function parseAppleUserName(raw: string | null | undefined): string | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as {
      name?: { firstName?: string; lastName?: string };
    };
    const parts = [parsed.name?.firstName, parsed.name?.lastName].filter(Boolean);
    return parts.length ? parts.join(" ") : null;
  } catch {
    return null;
  }
}
