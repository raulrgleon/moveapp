import { prisma } from "@/lib/prisma";
import { resolveMoveAccess } from "@/lib/db/move-access";
import { sendTaskReminderEmail } from "@/lib/notifications/email";
import { sendTaskReminderSms } from "@/lib/notifications/sms";
import { isValidE164Phone, normalizePhoneInput } from "@/lib/phone/normalize";

export async function processDueReminders() {
  const now = new Date();
  const inThreeDays = new Date();
  inThreeDays.setDate(inThreeDays.getDate() + 3);

  const users = await prisma.user.findMany({
    where: {
      suspendedAt: null,
      OR: [{ emailReminders: true }, { smsReminders: true }],
      role: { not: "admin" },
    },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      locale: true,
      emailReminders: true,
      smsReminders: true,
    },
  });

  let sent = 0;

  for (const user of users) {
    const access = await resolveMoveAccess(user.id);
    if (!access) continue;

    const move = await prisma.move.findUnique({
      where: { id: access.moveId },
      include: {
        checklistTasks: {
          where: {
            status: { not: "completed" },
            dueDate: { gte: now, lte: inThreeDays },
          },
        },
      },
    });

    const tasks = move?.checklistTasks ?? [];
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
        await sendTaskReminderEmail(
          user.email,
          user.name,
          taskPayload,
          user.locale === "es" ? "es" : "en"
        );
        await prisma.reminderLog.create({
          data: { userId: user.id, channel: "email" },
        });
        sent++;
      }
    }

    if (user.smsReminders && user.phone) {
      const top = taskPayload[0];
      const phone = normalizePhoneInput(user.phone);
      if (!phone || !isValidE164Phone(phone)) {
        console.warn(`[sms] Invalid phone for user ${user.id}: ${user.phone}`);
        continue;
      }

      const already = await prisma.reminderLog.findFirst({
        where: { userId: user.id, taskId: top.id, channel: "sms" },
      });
      if (!already) {
        const result = await sendTaskReminderSms(
          phone,
          top.title,
          top.dueDate,
          user.locale === "es" ? "es" : "en"
        );
        if (result.ok) {
          await prisma.reminderLog.create({
            data: { userId: user.id, taskId: top.id, channel: "sms" },
          });
          sent++;
        }
      }
    }
  }

  return { sent, usersChecked: users.length };
}
