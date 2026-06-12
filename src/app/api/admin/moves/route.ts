import { NextRequest, NextResponse } from "next/server";
import { forbidden, requireAdmin } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return forbidden();

  const q = req.nextUrl.searchParams.get("q")?.trim().toLowerCase();

  const moves = await prisma.move.findMany({
    orderBy: { updatedAt: "desc" },
    take: 100,
    include: {
      user: { select: { id: true, name: true, email: true } },
      _count: {
        select: {
          checklistTasks: true,
          documents: true,
          inventoryBoxes: true,
          collaborators: true,
        },
      },
    },
  });

  const filtered = q
    ? moves.filter(
        (m) =>
          m.origin.toLowerCase().includes(q) ||
          m.destination.toLowerCase().includes(q) ||
          m.user.email.toLowerCase().includes(q) ||
          m.user.name.toLowerCase().includes(q)
      )
    : moves;

  return NextResponse.json({ moves: filtered });
}
