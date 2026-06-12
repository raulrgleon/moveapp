import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { registerUserWithPassword } from "@/lib/auth/user-service";
import {
  COOKIE_NAME,
  createSession,
  isSecureRequest,
  sessionCookieOptions,
} from "@/lib/auth/session";
import { jsonError, resolveRequestLocale } from "@/lib/api-errors";
import { sendWelcomeEmail } from "@/lib/notifications/email";
import type { MoveProfile } from "@/lib/move-profile";
import type { VehicleInfo } from "@/lib/vehicles/types";
import type { Locale } from "@/lib/i18n";

function completeVehicles(vehicles: VehicleInfo[] = []): VehicleInfo[] {
  return vehicles.filter((v) => v.make?.trim() && v.model?.trim());
}

export async function POST(req: NextRequest) {
  const locale = resolveRequestLocale(req);
  try {
    const body = (await req.json()) as {
      email?: string;
      password?: string;
      name?: string;
      locale?: Locale;
      profile?: MoveProfile;
      vehicles?: VehicleInfo[];
      destinationAddress?: string;
      destinationLat?: number;
      destinationLon?: number;
      isAddressConfirmed?: boolean;
    };

    const email = body.email?.trim();
    const password = body.password?.trim();
    const name = body.name?.trim() || email?.split("@")[0] || "User";
    const userLocale: Locale = body.locale === "es" ? "es" : locale;

    if (!email || !password || password.length < 6) {
      return jsonError("passwordTooShort", 400, userLocale);
    }

    const user = await registerUserWithPassword(
      email,
      name,
      password,
      "user",
      null,
      body.profile,
      completeVehicles(body.vehicles),
      userLocale
    );

    if (body.destinationAddress || body.isAddressConfirmed) {
      const move = await prisma.move.findFirst({
        where: { userId: user.id },
        orderBy: { updatedAt: "desc" },
      });
      if (move) {
        await prisma.move.update({
          where: { id: move.id },
          data: {
            destinationAddress: body.destinationAddress ?? null,
            destinationLat: body.destinationLat ?? null,
            destinationLon: body.destinationLon ?? null,
          },
        });
      }
    }

    const { token, expiresAt } = await createSession(user.id, user.email, user.role);
    void sendWelcomeEmail(user.email, user.name, userLocale);

    const res = NextResponse.json({ user, moveId: user.role === "admin" ? null : "created" });
    res.cookies.set(COOKIE_NAME, token, sessionCookieOptions(expiresAt, isSecureRequest(req)));
    return res;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Registration failed";
    const status = message.includes("exists") ? 409 : 500;
    if (message.includes("exists")) {
      return jsonError("userExists", status, locale);
    }
    return NextResponse.json({ error: message }, { status });
  }
}
