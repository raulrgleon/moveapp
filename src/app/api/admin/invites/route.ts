import { NextRequest, NextResponse } from "next/server";
import { forbidden, requireAdmin } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return forbidden(req);

  const pendingOnly = req.nextUrl.searchParams.get("pending") !== "false";

  const invites = await prisma.moveCollaborator.findMany({
    where: pendingOnly ? { acceptedAt: null } : undefined,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      move: {
        select: {
          id: true,
          origin: true,
          destination: true,
          user: { select: { name: true, email: true } },
        },
      },
      user: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json({ invites });
}
