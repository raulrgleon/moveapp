import { NextRequest, NextResponse } from "next/server";
import { forbidden, requireAdmin } from "@/lib/api-auth";
import { getClientIp, logAdminAction } from "@/lib/admin/audit-log";
import { APP_GUIDE_FILENAME } from "@/lib/admin/app-guide-path";
import {
  readAppDocumentationFromDisk,
  writeAppDocumentationToDisk,
} from "@/lib/admin/generate-app-documentation";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return forbidden();

  const download = req.nextUrl.searchParams.get("download") === "1";
  const { content, meta } = readAppDocumentationFromDisk();

  if (!content) {
    return NextResponse.json(
      {
        ok: false,
        error: "NOT_GENERATED",
        message: "Documentation not generated yet. Use Update first.",
      },
      { status: 404 }
    );
  }

  if (download) {
    return new NextResponse(content, {
      headers: {
        "Content-Type": "text/markdown; charset=utf-8",
        "Content-Disposition": `attachment; filename="${APP_GUIDE_FILENAME}"`,
        "Cache-Control": "no-store",
      },
    });
  }

  return NextResponse.json({
    ok: true,
    content,
    meta,
    preview: content.slice(0, 8000),
    truncated: content.length > 8000,
  });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return forbidden();

  const meta = await writeAppDocumentationToDisk();
  const { content } = readAppDocumentationFromDisk();

  await logAdminAction({
    adminId: admin.id,
    action: "maintenance.regenerate_app_guide",
    details: { ...meta },
    ipAddress: getClientIp(req),
  });

  return NextResponse.json({
    ok: true,
    meta,
    byteSize: content.length,
    preview: content.slice(0, 8000),
    truncated: content.length > 8000,
  });
}
