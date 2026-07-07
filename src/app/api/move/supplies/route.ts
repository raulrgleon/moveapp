import { NextRequest, NextResponse } from "next/server";
import { jsonErrorFromRequest } from "@/lib/api-errors";
import { Prisma } from "@prisma/client";
import { requireCanEditData, requireMoveAccess } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export type SupplyChecks = Record<string, boolean>;

export async function GET(req: NextRequest) {
  const result = await requireMoveAccess(req);
  if (result instanceof NextResponse) return result;

  const move = await prisma.move.findUnique({
    where: { id: result.access.moveId },
    select: { supplyChecks: true },
  });

  const checks = (move?.supplyChecks as SupplyChecks | null) ?? {};
  return NextResponse.json({ checks });
}

export async function PATCH(req: NextRequest) {
  const result = await requireMoveAccess(req);
  if (result instanceof NextResponse) return result;

  const denied = requireCanEditData(result.access);
  if (denied) return denied;

  const body = (await req.json()) as { checks?: SupplyChecks };
  if (!body.checks || typeof body.checks !== "object") {
    return jsonErrorFromRequest(req, "checksRequired", 400);
  }

  const sanitized: SupplyChecks = {};
  for (const [key, value] of Object.entries(body.checks)) {
    if (typeof value === "boolean") sanitized[key] = value;
  }

  await prisma.move.update({
    where: { id: result.access.moveId },
    data: { supplyChecks: sanitized as unknown as Prisma.InputJsonValue },
  });

  return NextResponse.json({ ok: true, checks: sanitized });
}
