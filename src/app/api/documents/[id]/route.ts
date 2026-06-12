import { NextRequest, NextResponse } from "next/server";
import { requireCanEditData, requireMoveAccess } from "@/lib/api-auth";
import { deleteDocumentForUser } from "@/lib/db/move-service";
import { deleteDocumentFile } from "@/lib/storage/documents";

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const result = await requireMoveAccess(req);
  if (result instanceof NextResponse) return result;

  const denied = requireCanEditData(result.access);
  if (denied) return denied;

  try {
    const doc = await deleteDocumentForUser(result.user.id, params.id);
    if (doc.storageKey) {
      await deleteDocumentFile(doc.storageKey);
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("not found")) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }
    console.error("DELETE /api/documents/[id] error:", error);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
