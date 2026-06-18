import { randomBytes } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { requireCanEditData, requireMoveAccess } from "@/lib/api-auth";
import { requireProSubscription } from "@/lib/billing/require-pro";
import { prisma } from "@/lib/prisma";

function newToken() {
  return randomBytes(24).toString("hex");
}

export async function GET(req: NextRequest) {
  const proCheck = await requireProSubscription(req);
  if (proCheck instanceof NextResponse) return proCheck;
  const result = await requireMoveAccess(req);
  if (result instanceof NextResponse) return result;

  const move = await prisma.move.findUnique({
    where: { id: result.access.moveId },
    select: { planShareEnabled: true, planShareToken: true },
  });
  if (!move) return NextResponse.json({ enabled: false, shareUrl: null });

  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const shareUrl = move.planShareToken ? `${base}/plan/${move.planShareToken}` : null;

  return NextResponse.json({
    enabled: move.planShareEnabled,
    shareUrl: move.planShareEnabled ? shareUrl : null,
  });
}

export async function POST(req: NextRequest) {
  const proCheck = await requireProSubscription(req);
  if (proCheck instanceof NextResponse) return proCheck;
  const result = await requireMoveAccess(req);
  if (result instanceof NextResponse) return result;

  const denied = requireCanEditData(result.access);
  if (denied) return denied;

  const body = (await req.json()) as { enabled?: boolean };
  const enabled = body.enabled !== false;

  const existing = await prisma.move.findUnique({
    where: { id: result.access.moveId },
    select: { planShareToken: true },
  });

  const token = existing?.planShareToken ?? newToken();

  await prisma.move.update({
    where: { id: result.access.moveId },
    data: {
      planShareEnabled: enabled,
      planShareToken: token,
    },
  });

  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return NextResponse.json({
    enabled,
    shareUrl: enabled ? `${base}/plan/${token}` : null,
  });
}
