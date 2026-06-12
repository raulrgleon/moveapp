import { NextRequest, NextResponse } from "next/server";
import { requireCanEditData, requireMoveAccess } from "@/lib/api-auth";
import { replaceDocuments } from "@/lib/db/move-service";
import type { DocumentItem } from "@/lib/types";

export async function PUT(req: NextRequest) {
  const result = await requireMoveAccess(req);
  if (result instanceof NextResponse) return result;

  const denied = requireCanEditData(result.access);
  if (denied) return denied;

  try {
    const { documents } = (await req.json()) as {
      documents: (DocumentItem & { fileName?: string })[];
    };
    await replaceDocuments(result.user.id, documents ?? []);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("PUT /api/documents error:", error);
    return NextResponse.json({ error: "Failed to save documents" }, { status: 500 });
  }
}
