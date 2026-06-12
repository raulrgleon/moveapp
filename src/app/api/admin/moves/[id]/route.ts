import { NextRequest, NextResponse } from "next/server";
import { forbidden, requireAdmin } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const admin = await requireAdmin(_req);
  if (!admin) return forbidden();

  const move = await prisma.move.findUnique({
    where: { id: params.id },
    include: {
      user: { select: { id: true, name: true, email: true } },
      vehicles: true,
      checklistTasks: { orderBy: { dueDate: "asc" } },
      documents: { orderBy: { uploadedAt: "desc" } },
      inventoryBoxes: { orderBy: { boxNumber: "asc" } },
      budgetItems: { orderBy: { sortOrder: "asc" } },
      collaborators: {
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  });

  if (!move) {
    return NextResponse.json({ error: "Move not found" }, { status: 404 });
  }

  return NextResponse.json({ move });
}
