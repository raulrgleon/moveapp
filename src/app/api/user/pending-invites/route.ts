import { NextRequest, NextResponse } from "next/server";
import { getSessionUser, unauthorized } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return unauthorized();

  const invites = await prisma.moveCollaborator.findMany({
    where: {
      email: user.email.toLowerCase(),
      acceptedAt: null,
      inviteToken: { not: null },
    },
    orderBy: { createdAt: "desc" },
    include: {
      move: {
        include: {
          user: { select: { name: true } },
        },
      },
    },
  });

  return NextResponse.json({
    invites: invites.map((inv) => ({
      id: inv.id,
      token: inv.inviteToken,
      email: inv.email,
      role: inv.role,
      ownerName: inv.move.user.name,
      origin: inv.move.origin,
      destination: inv.move.destination,
      moveDate: inv.move.moveDate.toISOString().slice(0, 10),
    })),
  });
}
