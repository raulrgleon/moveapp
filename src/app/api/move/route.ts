import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, requireCanEditProfile, requireMoveAccess, unauthorized } from "@/lib/api-auth";
import { updateMoveForUserId } from "@/lib/db/move-service";
import type { MoveProfile } from "@/lib/move-profile";
import type { VehicleInfo } from "@/lib/vehicles/types";

export async function PATCH(req: NextRequest) {
  const result = await requireMoveAccess(req);
  if (result instanceof NextResponse) return result;

  const denied = requireCanEditProfile(result.access);
  if (denied) return denied;

  try {
    const body = (await req.json()) as {
      profile?: Partial<MoveProfile>;
      destinationAddress?: string | null;
      destinationLat?: number;
      destinationLon?: number;
      destinationLabel?: string;
      vehicles?: VehicleInfo[];
    };
    await updateMoveForUserId(result.user.id, body);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("PATCH /api/move error:", error);
    const message = error instanceof Error ? error.message : "Failed to update move";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
