import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { registerUserWithPassword, registerUserWithoutMove } from "@/lib/auth/user-service";
import { acceptMoveInviteByToken } from "@/lib/move/accept-invite";
import { syncMoveRoutesGeometry } from "@/lib/geo/move-routes-sync";
import {
  COOKIE_NAME,
  createSession,
  isSecureRequest,
  sessionCookieOptions,
} from "@/lib/auth/session";
import { jsonError, resolveRequestLocale } from "@/lib/api-errors";
import { sendWelcomeEmail } from "@/lib/notifications/email";
import { consumeRegisterToken, emailAlreadyRegistered, normalizeSignupEmail } from "@/lib/auth/email-verification";
import { validatePhoneForSave } from "@/lib/phone/normalize";
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
      inviteToken?: string;
      registerToken?: string;
      phone?: string;
    };

    const email = body.email?.trim();
    const password = body.password?.trim();
    const name = body.name?.trim() || email?.split("@")[0] || "User";
    const userLocale: Locale = body.locale === "es" ? "es" : locale;
    const inviteToken = body.inviteToken?.trim();

    if (!email || !password || password.length < 6) {
      return jsonError("passwordTooShort", 400, userLocale);
    }

    const phoneValidation = validatePhoneForSave(body.phone ?? "");
    if (!phoneValidation.ok) {
      return jsonError(
        phoneValidation.reason === "empty" ? "phoneRequired" : "phoneInvalid",
        400,
        userLocale
      );
    }

    const normalizedEmail = normalizeSignupEmail(email);

    if (!body.registerToken?.trim()) {
      return jsonError("verificationRequired", 400, userLocale);
    }

    const verified = await consumeRegisterToken(normalizedEmail, body.registerToken);
    if (!verified) {
      return jsonError("verificationRequired", 400, userLocale);
    }

    if (await emailAlreadyRegistered(normalizedEmail)) {
      return jsonError("userExists", 409, userLocale);
    }

    const user = inviteToken
      ? await registerUserWithoutMove(
          normalizedEmail,
          name,
          password,
          userLocale,
          phoneValidation.phone
        )
      : await registerUserWithPassword(
          normalizedEmail,
          name,
          password,
          "user",
          null,
          body.profile,
          completeVehicles(body.vehicles),
          userLocale,
          phoneValidation.phone
        );

    if (!inviteToken && (body.destinationAddress || body.isAddressConfirmed)) {
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

    if (!inviteToken && user.role !== "admin") {
      const move = await prisma.move.findFirst({
        where: { userId: user.id },
        orderBy: { updatedAt: "desc" },
      });
      if (move) {
        await syncMoveRoutesGeometry(move.id, userLocale);
      }
    }

    if (inviteToken) {
      await acceptMoveInviteByToken(inviteToken, user.id);
    }

    const { token, expiresAt } = await createSession(user.id, user.email, user.role);
    if (!inviteToken) {
      void sendWelcomeEmail(user.email, user.name, userLocale);
    }

    const res = NextResponse.json({
      user,
      moveId: inviteToken ? "joined" : user.role === "admin" ? null : "created",
    });
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
