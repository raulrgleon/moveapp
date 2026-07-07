import { NextRequest, NextResponse } from "next/server";
import { jsonErrorFromRequest } from "@/lib/api-errors";
import { requireCanEditData, requireMoveAccess } from "@/lib/api-auth";
import { logMoveActivity } from "@/lib/db/activity";
import { prisma } from "@/lib/prisma";
import { requireProSubscription } from "@/lib/billing/require-pro";
import { saveDocumentFile } from "@/lib/storage/documents";

export async function POST(req: NextRequest) {
  const proCheck = await requireProSubscription(req);
  if (proCheck instanceof NextResponse) return proCheck;
  const result = await requireMoveAccess(req);
  if (result instanceof NextResponse) return result;

  const denied = requireCanEditData(result.access);
  if (denied) return denied;

  try {
    const form = await req.formData();
    const file = form.get("file");
    const name = String(form.get("name") ?? "").trim();
    const category = String(form.get("category") ?? "Other").trim();
    const expiresAtRaw = String(form.get("expiresAt") ?? "").trim();
    const expiresAt = expiresAtRaw ? new Date(expiresAtRaw) : null;

    if (!(file instanceof File)) {
      return jsonErrorFromRequest(req, "invalidInput", 400);
    }

    const saved = await saveDocumentFile(result.access.moveId, file);
    const doc = await prisma.document.create({
      data: {
        moveId: result.access.moveId,
        name: name || saved.fileName,
        category,
        status: "pending",
        fileName: saved.fileName,
        storageKey: saved.storageKey,
        mimeType: saved.mimeType,
        sizeBytes: saved.sizeBytes,
        uploadedAt: new Date(),
        expiresAt: expiresAt && !Number.isNaN(expiresAt.getTime()) ? expiresAt : null,
      },
    });

    await logMoveActivity(result.access.moveId, result.user.id, "document_upload", {
      documentId: doc.id,
      name: doc.name,
      category: doc.category,
    });

    return NextResponse.json({
      document: {
        id: doc.id,
        name: doc.name,
        category: doc.category,
        status: doc.status,
        fileName: doc.fileName,
        hasFile: true,
        sizeBytes: doc.sizeBytes,
        uploadedAt: doc.uploadedAt?.toISOString().slice(0, 10),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
