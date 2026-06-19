import { prisma } from "@/lib/prisma";

export async function getAdminStats() {
  const now = new Date();
  const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    totalAdmins,
    suspendedUsers,
    totalMoves,
    usersToday,
    usersThisWeek,
    pendingInvites,
    totalDocuments,
    totalChecklistTasks,
    completedTasks,
    overdueTasks,
    totalPartners,
    totalPartnerQuotes,
    activePartners,
    recentUsers,
  ] = await Promise.all([
    prisma.user.count({ where: { role: { not: "admin" } } }),
    prisma.user.count({ where: { role: "admin" } }),
    prisma.user.count({ where: { suspendedAt: { not: null } } }),
    prisma.move.count(),
    prisma.user.count({ where: { createdAt: { gte: dayAgo }, role: { not: "admin" } } }),
    prisma.user.count({ where: { createdAt: { gte: weekAgo }, role: { not: "admin" } } }),
    prisma.moveCollaborator.count({ where: { acceptedAt: null } }),
    prisma.document.count(),
    prisma.checklistTask.count(),
    prisma.checklistTask.count({ where: { status: "completed" } }),
    prisma.checklistTask.count({
      where: {
        status: { not: "completed" },
        dueDate: { lt: now },
      },
    }),
    prisma.movingPartner.count(),
    prisma.partnerQuote.count(),
    prisma.movingPartner.count({ where: { active: true } }),
    prisma.user.findMany({
      where: { role: { not: "admin" } },
      orderBy: { createdAt: "desc" },
      take: 8,
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        suspendedAt: true,
      },
    }),
  ]);

  return {
    totalUsers,
    totalAdmins,
    suspendedUsers,
    totalMoves,
    usersToday,
    usersThisWeek,
    pendingInvites,
    totalDocuments,
    totalChecklistTasks,
    completedTasks,
    overdueTasks,
    totalPartners,
    totalPartnerQuotes,
    activePartners,
    recentUsers,
  };
}
