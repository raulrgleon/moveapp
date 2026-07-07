import { NextRequest, NextResponse } from "next/server";
import { jsonErrorFromRequest } from "@/lib/api-errors";
import { requireMoveAccess } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const result = await requireMoveAccess(req);
  if (result instanceof NextResponse) return result;

  const reads = await prisma.notificationRead.findMany({
    where: { userId: result.user.id },
    select: { key: true, readAt: true },
  });

  return NextResponse.json({
    readKeys: reads.map((r) => r.key),
  });
}

export async function PATCH(req: NextRequest) {
  const result = await requireMoveAccess(req);
  if (result instanceof NextResponse) return result;

  let keys: string[] = [];
  try {
    const body = (await req.json()) as { keys?: string[]; all?: boolean };
    if (body.all) {
      const now = new Date();
      const inThreeDays = new Date();
      inThreeDays.setDate(inThreeDays.getDate() + 3);

      const move = await prisma.move.findUnique({
        where: { id: result.access.moveId },
        include: {
          checklistTasks: {
            where: {
              status: { not: "completed" },
              dueDate: { gte: now, lte: inThreeDays },
            },
          },
        },
      });

      const pendingInvites =
        result.access.role === "owner"
          ? await prisma.moveCollaborator.findMany({
              where: { moveId: result.access.moveId, acceptedAt: null },
            })
          : [];

      const recentReminders = await prisma.reminderLog.findMany({
        where: { userId: result.user.id },
        orderBy: { sentAt: "desc" },
        take: 3,
      });

      keys = [
        ...(move?.checklistTasks.map((t) => `task-${t.id}`) ?? []),
        ...pendingInvites.map((c) => `invite-${c.id}`),
        ...recentReminders.map((r) => `reminder-${r.id}`),
      ];
    } else if (body.keys?.length) {
      keys = body.keys;
    }
  } catch {
    return jsonErrorFromRequest(req, "invalidInput", 400);
  }

  if (keys.length > 0) {
    await prisma.notificationRead.createMany({
      data: keys.map((key) => ({ userId: result.user.id, key })),
      skipDuplicates: true,
    });
  }

  return NextResponse.json({ ok: true, marked: keys.length });
}
