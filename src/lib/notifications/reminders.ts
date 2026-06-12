import { prisma } from "@/lib/prisma";
import { sendTaskReminderEmail } from "@/lib/notifications/email";
import { sendTaskReminderSms } from "@/lib/notifications/sms";

export async function processDueReminders() {
  const now = new Date();
  const inThreeDays = new Date();
  inThreeDays.setDate(inThreeDays.getDate() + 3);

  const users = await prisma.user.findMany({
    where: {
      OR: [{ emailReminders: true }, { smsReminders: true }],
      role: { not: "admin" },
    },
    include: {
      moves: {
        take: 1,
        orderBy: { updatedAt: "desc" },
        include: {
          checklistTasks: {
            where: {
              status: { not: "completed" },
              dueDate: { gte: now, lte: inThreeDays },
            },
          },
        },
      },
    },
  });

  let sent = 0;

  for (const user of users) {
    const tasks = user.moves[0]?.checklistTasks ?? [];
    if (tasks.length === 0) continue;

    const taskPayload = tasks.map((t) => ({
      id: t.id,
      title: t.title,
      dueDate: t.dueDate!.toISOString().slice(0, 10),
    }));

    if (user.emailReminders) {
      const already = await prisma.reminderLog.findFirst({
        where: {
          userId: user.id,
          channel: "email",
          sentAt: { gte: new Date(now.getTime() - 20 * 60 * 60 * 1000) },
        },
      });
      if (!already) {
        await sendTaskReminderEmail(user.email, user.name, taskPayload);
        await prisma.reminderLog.create({
          data: { userId: user.id, channel: "email" },
        });
        sent++;
      }
    }

    if (user.smsReminders && user.phone) {
      const top = taskPayload[0];
      const already = await prisma.reminderLog.findFirst({
        where: { userId: user.id, taskId: top.id, channel: "sms" },
      });
      if (!already) {
        await sendTaskReminderSms(user.phone, top.title, top.dueDate);
        await prisma.reminderLog.create({
          data: { userId: user.id, taskId: top.id, channel: "sms" },
        });
        sent++;
      }
    }
  }

  return { sent, usersChecked: users.length };
}
