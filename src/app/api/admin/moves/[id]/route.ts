import { NextRequest, NextResponse } from "next/server";
import { forbidden, requireAdmin } from "@/lib/api-auth";
import { getClientIp, logAdminAction } from "@/lib/admin/audit-log";
import { deleteMoveByAdmin } from "@/lib/admin/move-delete";
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

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const admin = await requireAdmin(req);
  if (!admin) return forbidden();

  try {
    const deleted = await deleteMoveByAdmin(params.id);

    await logAdminAction({
      adminId: admin.id,
      action: "move.delete",
      targetType: "move",
      targetId: params.id,
      details: {
        ownerId: deleted.ownerId,
        ownerEmail: deleted.ownerEmail,
        route: `${deleted.origin} → ${deleted.destination}`,
      },
      ipAddress: getClientIp(req),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to delete move";
    const status = message.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
