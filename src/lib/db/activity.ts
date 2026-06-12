import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function logMoveActivity(
  moveId: string,
  userId: string,
  action: string,
  details?: Record<string, unknown>
) {
  await prisma.moveActivity.create({
    data: {
      moveId,
      userId,
      action,
      details: details as Prisma.InputJsonValue | undefined,
    },
  });
}

export async function listMoveActivities(moveId: string, limit = 50) {
  const rows = await prisma.moveActivity.findMany({
    where: { moveId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: { user: { select: { name: true, email: true } } },
  });
  return rows.map((r) => ({
    id: r.id,
    action: r.action,
    details: r.details,
    createdAt: r.createdAt.toISOString(),
    userName: r.user.name,
    userEmail: r.user.email,
  }));
}
