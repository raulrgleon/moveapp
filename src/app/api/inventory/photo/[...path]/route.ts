import { NextRequest, NextResponse } from "next/server";
import { jsonErrorFromRequest } from "@/lib/api-errors";
import { requireMoveAccess } from "@/lib/api-auth";
import { readInventoryPhoto } from "@/lib/storage/inventory";

export async function GET(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  const result = await requireMoveAccess(req);
  if (result instanceof NextResponse) return result;

  const storageKey = params.path.join("/");
  if (!storageKey.startsWith(result.access.moveId)) {
    return jsonErrorFromRequest(req, "notFound", 404);
  }

  try {
    const buffer = await readInventoryPhoto(storageKey);
    const ext = storageKey.split(".").pop()?.toLowerCase();
    const mime =
      ext === "png"
        ? "image/png"
        : ext === "webp"
          ? "image/webp"
          : ext === "gif"
            ? "image/gif"
            : "image/jpeg";

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": mime,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return jsonErrorFromRequest(req, "fileNotFound", 404);
  }
}
