import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { requireCanEditData, requireMoveAccess } from "@/lib/api-auth";
import { jsonError, resolveRequestLocale } from "@/lib/api-errors";
import {
  sanitizeShoppingSelections,
  type ShoppingSelectionRecord,
} from "@/lib/amazon/shopping-selections";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const locale = resolveRequestLocale(req);
  const result = await requireMoveAccess(req);
  if (result instanceof NextResponse) return result;

  const move = await prisma.move.findUnique({
    where: { id: result.access.moveId },
    select: { shoppingSelections: true },
  });

  const selections = sanitizeShoppingSelections(move?.shoppingSelections);
  return NextResponse.json({ selections });
}

export async function PATCH(req: NextRequest) {
  const locale = resolveRequestLocale(req);
  const result = await requireMoveAccess(req);
  if (result instanceof NextResponse) return result;

  const denied = requireCanEditData(result.access, req);
  if (denied) return denied;

  const body = (await req.json()) as { selections?: unknown };
  if (!Array.isArray(body.selections)) {
    return jsonError("invalidInput", 400, locale);
  }

  const selections: ShoppingSelectionRecord[] = sanitizeShoppingSelections(body.selections);

  await prisma.move.update({
    where: { id: result.access.moveId },
    data: {
      shoppingSelections: selections as unknown as Prisma.InputJsonValue,
    },
  });

  return NextResponse.json({ ok: true, selections });
}
