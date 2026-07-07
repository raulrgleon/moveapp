import { NextRequest, NextResponse } from "next/server";
import { forbidden, requireAdmin } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return forbidden(req);

  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") ?? 50), 200);
  const action = req.nextUrl.searchParams.get("action");

  const logs = await prisma.adminAuditLog.findMany({
    where: action ? { action } : undefined,
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      admin: { select: { id: true, name: true, email: true } },
    },
  });

  return NextResponse.json({ logs });
}
