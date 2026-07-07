import { NextRequest, NextResponse } from "next/server";
import { jsonErrorFromRequest } from "@/lib/api-errors";
import { requireCanEditData, requireMoveAccess } from "@/lib/api-auth";
import { requireProSubscription } from "@/lib/billing/require-pro";
import { replaceDocuments } from "@/lib/db/move-service";
import type { DocumentItem } from "@/lib/types";

export async function PUT(req: NextRequest) {
  const proCheck = await requireProSubscription(req);
  if (proCheck instanceof NextResponse) return proCheck;

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
    return jsonErrorFromRequest(req, "saveFailed", 500);
  }
}
