import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireCanEditData, requireMoveAccess } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export interface UtilityPick {
  providerName: string;
  category: string;
  contractedAt: string;
}

export async function GET(req: NextRequest) {
  const result = await requireMoveAccess(req);
  if (result instanceof NextResponse) return result;

  const move = await prisma.move.findUnique({
    where: { id: result.access.moveId },
    select: { utilityPicks: true },
  });

  const picks = (move?.utilityPicks as UtilityPick[] | null) ?? [];
  return NextResponse.json({ picks });
}

export async function POST(req: NextRequest) {
  const result = await requireMoveAccess(req);
  if (result instanceof NextResponse) return result;

  const denied = requireCanEditData(result.access);
  if (denied) return denied;

  const body = (await req.json()) as { providerName?: string; category?: string };
  const providerName = body.providerName?.trim();
  const category = body.category?.trim();
  if (!providerName || !category) {
    return NextResponse.json({ error: "providerName and category required" }, { status: 400 });
  }

  const move = await prisma.move.findUnique({
    where: { id: result.access.moveId },
    select: { utilityPicks: true },
  });

  const existing = (move?.utilityPicks as UtilityPick[] | null) ?? [];
  const filtered = existing.filter(
    (p) => p.category.toLowerCase() !== category.toLowerCase()
  );
  const picks: UtilityPick[] = [
    ...filtered,
    { providerName, category, contractedAt: new Date().toISOString() },
  ];

  await prisma.move.update({
    where: { id: result.access.moveId },
    data: { utilityPicks: picks as unknown as Prisma.InputJsonValue },
  });

  return NextResponse.json({ ok: true, picks });
}

export async function DELETE(req: NextRequest) {
  const result = await requireMoveAccess(req);
  if (result instanceof NextResponse) return result;

  const denied = requireCanEditData(result.access);
  if (denied) return denied;

  const body = (await req.json()) as { category?: string };
  const category = body.category?.trim()?.toLowerCase();
  if (!category) {
    return NextResponse.json({ error: "category required" }, { status: 400 });
  }

  const move = await prisma.move.findUnique({
    where: { id: result.access.moveId },
    select: { utilityPicks: true },
  });

  const existing = (move?.utilityPicks as UtilityPick[] | null) ?? [];
  const picks = existing.filter((p) => p.category.toLowerCase() !== category);

  await prisma.move.update({
    where: { id: result.access.moveId },
    data: { utilityPicks: picks as unknown as Prisma.InputJsonValue },
  });

  return NextResponse.json({ ok: true, picks });
}
