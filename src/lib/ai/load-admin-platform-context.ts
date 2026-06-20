import { prisma } from "@/lib/prisma";

/** Platform-wide customer summary for admin Pilot only. */
export async function loadAdminPlatformContext(): Promise<string> {
  const [userCount, moveCount, recentUsers] = await Promise.all([
    prisma.user.count({ where: { role: { not: "admin" }, suspendedAt: null } }),
    prisma.move.count(),
    prisma.user.findMany({
      where: { role: { not: "admin" }, suspendedAt: null },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        name: true,
        email: true,
        planTier: true,
        locale: true,
        phone: true,
        emailReminders: true,
        smsReminders: true,
        createdAt: true,
        moves: {
          orderBy: { updatedAt: "desc" },
          take: 1,
          select: {
            id: true,
            origin: true,
            destination: true,
            moveDate: true,
            household: true,
            pets: true,
            budget: true,
            updatedAt: true,
            _count: {
              select: {
                checklistTasks: true,
                inventoryBoxes: true,
                documents: true,
                vehicles: true,
                partnerQuotes: true,
              },
            },
          },
        },
      },
    }),
  ]);

  const lines = recentUsers.map((u) => {
    const m = u.moves[0];
    if (!m) {
      return `- ${u.name} <${u.email}> | user ${u.id} | plan ${u.planTier} | no move yet`;
    }
    const done = m._count.checklistTasks;
    return `- ${u.name} <${u.email}> | user ${u.id} | move ${m.id} | ${m.origin} → ${m.destination} | date ${m.moveDate.toISOString().slice(0, 10)} | ${m.household}${m.pets ? " +pets" : ""} | budget $${m.budget} | tasks ${done} | boxes ${m._count.inventoryBoxes} | docs ${m._count.documents} | vehicles ${m._count.vehicles} | quotes ${m._count.partnerQuotes} | plan ${u.planTier}`;
  });

  return `PLATFORM OVERVIEW (admin-only — treat as confidential):
Total customers: ${userCount}
Total moves: ${moveCount}

RECENT CUSTOMERS (up to 50):
${lines.join("\n") || "(none)"}

When answering about a specific customer, use their email/name from this list. For deep detail on one move, ask the admin to open that user in Admin → Users or impersonate them.`;
}
