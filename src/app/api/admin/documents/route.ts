import { NextRequest, NextResponse } from "next/server";
import { forbidden, requireAdmin } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return forbidden();

  const documents = await prisma.document.findMany({
    orderBy: { uploadedAt: "desc" },
    take: 200,
    include: {
      move: {
        select: {
          id: true,
          origin: true,
          destination: true,
          user: { select: { id: true, name: true, email: true } },
        },
      },
    },
  });

  const totalBytes = documents.reduce((sum, d) => sum + (d.sizeBytes ?? 0), 0);

  return NextResponse.json({ documents, totalBytes });
}
