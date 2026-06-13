import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { requireCanEditData, requireMoveAccess } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const result = await requireMoveAccess(req);
  if (result instanceof NextResponse) return result;

  const move = await prisma.move.findUnique({
    where: { id: result.access.moveId },
    select: {
      partnerShareEnabled: true,
      partnerShareToken: true,
      origin: true,
      destination: true,
      moveDate: true,
      household: true,
    },
  });

  if (!move) return NextResponse.json({ error: "Move not found" }, { status: 404 });

  const quotes = await prisma.partnerQuote.findMany({
    where: { moveId: result.access.moveId },
    orderBy: { createdAt: "desc" },
  });

  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const shareUrl = move.partnerShareToken
    ? `${base}/quote/${move.partnerShareToken}`
    : null;

  return NextResponse.json({
    enabled: move.partnerShareEnabled,
    shareUrl,
    shareToken: move.partnerShareToken,
    quotes,
    moveSummary: {
      origin: move.origin,
      destination: move.destination,
      moveDate: move.moveDate.toISOString().slice(0, 10),
      household: move.household,
    },
  });
}

export async function POST(req: NextRequest) {
  const result = await requireMoveAccess(req);
  if (result instanceof NextResponse) return result;

  const denied = requireCanEditData(result.access);
  if (denied) return denied;
  if (result.access.role !== "owner") {
    return NextResponse.json({ error: "Owner only" }, { status: 403 });
  }

  const { enabled } = (await req.json()) as { enabled?: boolean };

  if (enabled === false) {
    await prisma.move.update({
      where: { id: result.access.moveId },
      data: { partnerShareEnabled: false },
    });
    return NextResponse.json({ enabled: false, shareUrl: null });
  }

  const existing = await prisma.move.findUnique({
    where: { id: result.access.moveId },
    select: { partnerShareToken: true },
  });
  const token = existing?.partnerShareToken ?? randomUUID().replace(/-/g, "").slice(0, 24);

  await prisma.move.update({
    where: { id: result.access.moveId },
    data: { partnerShareEnabled: true, partnerShareToken: token },
  });

  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return NextResponse.json({
    enabled: true,
    shareUrl: `${base}/quote/${token}`,
  });
}
