import { NextRequest, NextResponse } from "next/server";
import { getSessionEmail, unauthorized } from "@/lib/api-auth";
import { updateMoveForUser } from "@/lib/db/move-service";
import type { MoveProfile } from "@/lib/move-profile";
import type { VehicleInfo } from "@/lib/vehicles/types";

export async function PATCH(req: NextRequest) {
  const email = await getSessionEmail(req);
  if (!email) return unauthorized();

  try {
    const body = (await req.json()) as {
      profile?: Partial<MoveProfile>;
      destinationAddress?: string | null;
      destinationLat?: number;
      destinationLon?: number;
      destinationLabel?: string;
      vehicles?: VehicleInfo[];
    };
    await updateMoveForUser(email, body);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("PATCH /api/move error:", error);
    return NextResponse.json({ error: "Failed to update move" }, { status: 500 });
  }
}
