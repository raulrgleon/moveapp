import { NextRequest, NextResponse } from "next/server";
import { authenticateUser } from "@/lib/auth/user-service";
import {
  COOKIE_NAME,
  createSession,
  isSecureRequest,
  sessionCookieOptions,
} from "@/lib/auth/session";

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      identifier?: string;
      email?: string;
      password?: string;
    };

    const identifier = (body.identifier ?? body.email)?.trim();
    const password = body.password?.trim();

    if (!identifier || !password) {
      return NextResponse.json({ error: "Email/username and password required" }, { status: 400 });
    }

    const result = await authenticateUser(identifier, password);
    if (!result) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }
    if ("suspended" in result && result.suspended) {
      return NextResponse.json({ error: "Account suspended" }, { status: 403 });
    }

    const { user, moveId } = result as { user: { id: string; email: string; role: string }; moveId: string | null };
    const { token, expiresAt } = await createSession(user.id, user.email, user.role);

    const res = NextResponse.json({ user, moveId });
    res.cookies.set(COOKIE_NAME, token, sessionCookieOptions(expiresAt, isSecureRequest(req)));
    return res;
  } catch (error) {
    console.error("Login error:", error);
    const message = error instanceof Error ? error.message : "Login failed";
    if (message.includes("AUTH_SECRET")) {
      return NextResponse.json({ error: "Auth not configured on server" }, { status: 503 });
    }
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
