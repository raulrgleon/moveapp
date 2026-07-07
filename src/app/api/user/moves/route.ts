import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, unauthorized } from "@/lib/api-auth";
import { listUserMoves } from "@/lib/db/move-service";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return unauthorized(req);
  if (user.role === "admin") {
    return NextResponse.json({ activeMoveId: null, moves: [] });
  }

  const data = await listUserMoves(user.id);
  return NextResponse.json(data);
}
