export interface TwilioCredentials {
  accountSid: string;
  username: string;
  password: string;
  from: string;
}

export interface TwilioConfigStatus {
  configured: boolean;
  missing: string[];
  phone: string | null;
  authMethod: "api_key" | "auth_token" | null;
}

export function getTwilioConfigStatus(): TwilioConfigStatus {
  const accountSid = process.env.TWILIO_ACCOUNT_SID?.trim();
  const from = process.env.TWILIO_PHONE_NUMBER?.trim() ?? null;
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const apiKeySid = process.env.TWILIO_API_KEY_SID?.trim();
  const apiKeySecret = process.env.TWILIO_API_KEY_SECRET?.trim();

  const missing: string[] = [];
  if (!accountSid) missing.push("TWILIO_ACCOUNT_SID");
  if (!from) missing.push("TWILIO_PHONE_NUMBER");

  let authMethod: TwilioConfigStatus["authMethod"] = null;
  if (apiKeySid && apiKeySecret) {
    authMethod = "api_key";
  } else if (authToken) {
    authMethod = "auth_token";
  } else {
    missing.push("TWILIO_AUTH_TOKEN or TWILIO_API_KEY_SID + TWILIO_API_KEY_SECRET");
  }

  return {
    configured: missing.length === 0,
    missing,
    phone: from,
    authMethod,
  };
}

/** Supports Account SID + Auth Token, or Account SID + API Key SID/Secret. */
export function getTwilioCredentials(): TwilioCredentials | null {
  const status = getTwilioConfigStatus();
  if (!status.configured) return null;

  const accountSid = process.env.TWILIO_ACCOUNT_SID!.trim();
  const from = process.env.TWILIO_PHONE_NUMBER!.trim();
  const authToken = process.env.TWILIO_AUTH_TOKEN?.trim();
  const apiKeySid = process.env.TWILIO_API_KEY_SID?.trim();
  const apiKeySecret = process.env.TWILIO_API_KEY_SECRET?.trim();

  if (apiKeySid && apiKeySecret) {
    return { accountSid, username: apiKeySid, password: apiKeySecret, from };
  }

  if (authToken) {
    return { accountSid, username: accountSid, password: authToken, from };
  }

  return null;
}

export function isTwilioConfigured(): boolean {
  return getTwilioConfigStatus().configured;
}

export interface TwilioSendResult {
  ok: boolean;
  sid?: string;
  error?: string;
  status?: number;
}

export async function sendTwilioSms(to: string, body: string): Promise<TwilioSendResult> {
  const creds = getTwilioCredentials();
  if (!creds) {
    return { ok: false, error: "Twilio not configured" };
  }

  const params = new URLSearchParams({
    To: to,
    From: creds.from,
    Body: body,
  });

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${creds.accountSid}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${creds.username}:${creds.password}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    }
  );

  const text = await res.text();
  if (!res.ok) {
    let message = text;
    try {
      const parsed = JSON.parse(text) as { message?: string };
      message = parsed.message ?? text;
    } catch {
      /* keep raw */
    }
    return { ok: false, error: message, status: res.status };
  }

  try {
    const parsed = JSON.parse(text) as { sid?: string };
    return { ok: true, sid: parsed.sid };
  } catch {
    return { ok: true };
  }
}

/** Verify credentials against Twilio (does not send SMS). */
export async function verifyTwilioConnection(): Promise<TwilioSendResult> {
  const creds = getTwilioCredentials();
  if (!creds) {
    return { ok: false, error: "Twilio not configured" };
  }

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${creds.accountSid}.json`,
    {
      headers: {
        Authorization: `Basic ${Buffer.from(`${creds.username}:${creds.password}`).toString("base64")}`,
      },
    }
  );

  const text = await res.text();
  if (!res.ok) {
    let message = text;
    try {
      const parsed = JSON.parse(text) as { message?: string };
      message = parsed.message ?? text;
    } catch {
      /* keep raw */
    }
    return { ok: false, error: message, status: res.status };
  }

  return { ok: true };
}
