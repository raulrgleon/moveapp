import { NextRequest, NextResponse } from "next/server";
import { forbidden, requireAdmin } from "@/lib/api-auth";
import {
  ensureMoveForUserId,
  getUserDataByUserId,
  updateMoveForUserId,
} from "@/lib/db/move-service";
import type { MoveProfile } from "@/lib/move-profile";

type RouteContext = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const admin = await requireAdmin(_req);
  if (!admin) return forbidden();

  const data = await getUserDataByUserId(params.id);
  if (!data) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(data);
}

export async function PATCH(req: NextRequest, { params }: RouteContext) {
  const admin = await requireAdmin(req);
  if (!admin) return forbidden();

  try {
    const body = (await req.json()) as {
      profile?: Partial<MoveProfile>;
      destinationAddress?: string | null;
      destinationLat?: number;
      destinationLon?: number;
      destinationLabel?: string;
      createMove?: boolean;
    };

    if (body.createMove) {
      await ensureMoveForUserId(params.id);
    }

    await updateMoveForUserId(params.id, body, true);

    const data = await getUserDataByUserId(params.id);
    return NextResponse.json(data);
  } catch (error) {
    console.error("Admin move update error:", error);
    const message = error instanceof Error ? error.message : "Failed to update move";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
