import { prisma } from "@/lib/prisma";

export type AnnouncementType = "info" | "warning" | "maintenance";

export async function getActiveAnnouncements() {
  const now = new Date();
  return prisma.systemAnnouncement.findMany({
    where: {
      active: true,
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
      ],
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      message: true,
      type: true,
      startsAt: true,
      endsAt: true,
    },
  });
}
