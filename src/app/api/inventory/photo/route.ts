import { NextRequest, NextResponse } from "next/server";
import { requireCanEditData, requireMoveAccess } from "@/lib/api-auth";
import {
  saveInventoryPhoto,
  saveInventoryPhotoFromBase64,
} from "@/lib/storage/inventory";

export async function POST(req: NextRequest) {
  const result = await requireMoveAccess(req);
  if (result instanceof NextResponse) return result;

  const denied = requireCanEditData(result.access);
  if (denied) return denied;

  try {
    const contentType = req.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      const body = (await req.json()) as { dataUrl?: string };
      if (!body.dataUrl?.startsWith("data:image/")) {
        return NextResponse.json({ error: "dataUrl required" }, { status: 400 });
      }
      const saved = await saveInventoryPhotoFromBase64(result.access.moveId, body.dataUrl);
      return NextResponse.json({
        photoUrl: saved.photoUrl,
        storageKey: saved.storageKey,
      });
    }

    const form = await req.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "File required" }, { status: 400 });
    }

    const saved = await saveInventoryPhoto(result.access.moveId, file);
    return NextResponse.json({
      photoUrl: saved.photoUrl,
      storageKey: saved.storageKey,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
