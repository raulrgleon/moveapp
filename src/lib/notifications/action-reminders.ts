import { prisma } from "@/lib/prisma";
import { resolveMoveAccess } from "@/lib/db/move-access";
import { sendActionReminderEmail } from "@/lib/notifications/email";

export async function processActionReminders() {
  const now = new Date();
  const users = await prisma.user.findMany({
    where: {
      suspendedAt: null,
      emailReminders: true,
      role: { not: "admin" },
    },
    select: {
      id: true,
      email: true,
      name: true,
      locale: true,
    },
  });

  let sent = 0;
  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  for (const user of users) {
    const access = await resolveMoveAccess(user.id);
    if (!access) continue;

    const move = await prisma.move.findUnique({
      where: { id: access.moveId },
      include: {
        checklistTasks: {
          where: { status: { not: "completed" }, priority: "high" },
          take: 5,
        },
      },
    });
    if (!move) continue;

    const locale = user.locale === "es" ? "es" : "en";
    const moveDate = move.moveDate;
    const daysUntil = Math.round(
      (moveDate.getTime() - now.getTime()) / 86400000
    );

    const gaps: { key: string; href: string }[] = [];

    if (!move.truckChoice?.trim()) {
      gaps.push({ key: "missingTruck", href: `${base}/trucks` });
    }
    if (!move.destinationAddress?.trim()) {
      gaps.push({ key: "missingAddress", href: `${base}/utilities` });
    }
    if (daysUntil >= 0 && daysUntil <= 7 && move.checklistTasks.length > 0) {
      gaps.push({ key: "highPriorityTasks", href: `${base}/checklist` });
    }
    if (daysUntil >= 0 && daysUntil <= 14 && daysUntil % 7 === 0) {
      gaps.push({ key: "moveCountdown", href: `${base}/dashboard` });
    }

    if (gaps.length === 0) continue;

    const already = await prisma.reminderLog.findFirst({
      where: {
        userId: user.id,
        channel: "email_action",
        sentAt: { gte: new Date(now.getTime() - 23 * 60 * 60 * 1000) },
      },
    });
    if (already) continue;

    await sendActionReminderEmail(user.email, user.name, gaps.map((g) => g.key), locale, base);
    await prisma.reminderLog.create({
      data: { userId: user.id, channel: "email_action" },
    });
    sent++;
  }

  return { sent, usersChecked: users.length };
}
