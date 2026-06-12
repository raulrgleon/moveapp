import { NextRequest, NextResponse } from "next/server";
import { forbidden, requireAdmin } from "@/lib/api-auth";
import { getClientIp, logAdminAction } from "@/lib/admin/audit-log";
import { prisma } from "@/lib/prisma";
import { deleteDocumentFile } from "@/lib/storage/documents";

type RouteContext = { params: { id: string } };

export async function DELETE(req: NextRequest, { params }: RouteContext) {
  const admin = await requireAdmin(req);
  if (!admin) return forbidden();

  const doc = await prisma.document.findUnique({ where: { id: params.id } });
  if (!doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  if (doc.storageKey) {
    await deleteDocumentFile(doc.storageKey);
  }

  await prisma.document.delete({ where: { id: params.id } });

  await logAdminAction({
    adminId: admin.id,
    action: "document.delete",
    targetType: "document",
    targetId: params.id,
    details: { name: doc.name, moveId: doc.moveId },
    ipAddress: getClientIp(req),
  });

  return NextResponse.json({ ok: true });
}
