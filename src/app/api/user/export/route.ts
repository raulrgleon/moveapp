import { NextRequest, NextResponse } from "next/server";
import { jsonErrorFromRequest } from "@/lib/api-errors";
import { getSessionUser, unauthorized } from "@/lib/api-auth";
import { getUserDataByUserId } from "@/lib/db/move-service";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const user = await getSessionUser(req);
  if (!user) return unauthorized(req);

  const data = await getUserDataByUserId(user.id);
  if (!data) return jsonErrorFromRequest(req, "notFound", 404);

  const collaborations = await prisma.moveCollaborator.findMany({
    where: { userId: user.id, acceptedAt: { not: null } },
    include: { move: { select: { origin: true, destination: true } } },
  });

  return NextResponse.json({
    exportedAt: new Date().toISOString(),
    user: data.user,
    move: data.moveId
      ? {
          id: data.moveId,
          role: data.moveRole,
          ownerName: data.ownerName,
          profile: data.profile,
          destinationAddress: data.destinationAddress,
          vehicles: data.vehicles,
          checklist: data.checklist,
          inventory: data.inventory,
          documents: data.documents,
        }
      : null,
    collaborations,
  });
}
