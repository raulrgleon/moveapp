import { NextRequest, NextResponse } from "next/server";
import { requireMoveAccess } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const result = await requireMoveAccess(req);
  if (result instanceof NextResponse) return result;

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
        orderBy: { dueDate: "asc" },
        take: 5,
      },
    },
  });

  const pendingInvites =
    result.access.role === "owner"
      ? await prisma.moveCollaborator.findMany({
          where: { moveId: result.access.moveId, acceptedAt: null },
          orderBy: { createdAt: "desc" },
          take: 5,
        })
      : [];

  const recentReminders = await prisma.reminderLog.findMany({
    where: { userId: result.user.id },
    orderBy: { sentAt: "desc" },
    take: 3,
  });

  const notifications = [
    ...((move?.checklistTasks ?? []).map((t) => ({
      id: `task-${t.id}`,
      type: "task_due" as const,
      title: t.title,
      message: t.dueDate
        ? `Due ${t.dueDate.toISOString().slice(0, 10)}`
        : "Due soon",
      href: "/checklist",
      createdAt: t.dueDate?.toISOString() ?? now.toISOString(),
    })) ?? []),
    ...(pendingInvites.map((c) => ({
      id: `invite-${c.id}`,
      type: "invite_pending" as const,
      title: "Collaborator invite pending",
      message: `${c.email} has not accepted yet`,
      href: "/settings",
      createdAt: c.createdAt.toISOString(),
    })) ?? []),
    ...(recentReminders.map((r) => ({
      id: `reminder-${r.id}`,
      type: "reminder_sent" as const,
      title: r.channel === "email" ? "Email reminder sent" : "SMS reminder sent",
      message: r.sentAt.toISOString().slice(0, 16).replace("T", " "),
      href: "/checklist",
      createdAt: r.sentAt.toISOString(),
    })) ?? []),
  ].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

  return NextResponse.json({
    unreadCount: notifications.length,
    notifications: notifications.slice(0, 15),
    moveRole: result.access.role,
    ownerName: result.access.ownerName,
  });
}
