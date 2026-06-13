import { NextRequest, NextResponse } from "next/server";
import { requireCanEditData, requireMoveAccess } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: NextRequest) {
  const result = await requireMoveAccess(req);
  if (result instanceof NextResponse) return result;

  const denied = requireCanEditData(result.access);
  if (denied) return denied;

  const { quoteId, status } = (await req.json()) as {
    quoteId?: string;
    status?: string;
  };

  if (!quoteId || !status) {
    return NextResponse.json({ error: "quoteId and status required" }, { status: 400 });
  }

  const updated = await prisma.partnerQuote.updateMany({
    where: { id: quoteId, moveId: result.access.moveId },
    data: { status },
  });

  if (updated.count === 0) {
    return NextResponse.json({ error: "Quote not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
