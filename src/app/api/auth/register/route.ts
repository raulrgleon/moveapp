import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { registerUserWithPassword } from "@/lib/auth/user-service";
import {
  COOKIE_NAME,
  createSession,
  isSecureRequest,
  sessionCookieOptions,
} from "@/lib/auth/session";
import type { MoveProfile } from "@/lib/move-profile";
import type { VehicleInfo } from "@/lib/vehicles/types";

function completeVehicles(vehicles: VehicleInfo[] = []): VehicleInfo[] {
  return vehicles.filter((v) => v.make?.trim() && v.model?.trim());
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as {
      email?: string;
      password?: string;
      name?: string;
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

    if (!email || !password || password.length < 6) {
      return NextResponse.json({ error: "Email and password (min 6 chars) required" }, { status: 400 });
    }

    const user = await registerUserWithPassword(
      email,
      name,
      password,
      "user",
      null,
      body.profile,
      completeVehicles(body.vehicles)
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
    const res = NextResponse.json({ user, moveId: user.role === "admin" ? null : "created" });
    res.cookies.set(COOKIE_NAME, token, sessionCookieOptions(expiresAt, isSecureRequest(req)));
    return res;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Registration failed";
    return NextResponse.json({ error: message }, { status: message.includes("exists") ? 409 : 500 });
  }
}
