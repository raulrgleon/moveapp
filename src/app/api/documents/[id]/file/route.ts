import { NextRequest, NextResponse } from "next/server";
import { jsonErrorFromRequest } from "@/lib/api-errors";
import { requireMoveAccess } from "@/lib/api-auth";
import { requireProSubscription } from "@/lib/billing/require-pro";
import { getDocumentForUser } from "@/lib/db/move-service";
import { readDocumentFile } from "@/lib/storage/documents";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const proCheck = await requireProSubscription(req);
  if (proCheck instanceof NextResponse) return proCheck;

  const result = await requireMoveAccess(req);
  if (result instanceof NextResponse) return result;

  const found = await getDocumentForUser(result.user.id, params.id);
  if (!found?.doc.storageKey) {
    return jsonErrorFromRequest(req, "fileNotFound", 404);
  }

  try {
    const buffer = await readDocumentFile(found.doc.storageKey);
    const filename = found.doc.fileName ?? "document";
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": found.doc.mimeType ?? "application/octet-stream",
        "Content-Disposition": `inline; filename="${filename.replace(/"/g, "")}"`,
        "Content-Length": String(buffer.length),
      },
    });
  } catch {
    return jsonErrorFromRequest(req, "fileMissingOnServer", 404);
  }
}
