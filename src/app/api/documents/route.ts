import { NextRequest, NextResponse } from "next/server";
import { getSessionEmail, unauthorized } from "@/lib/api-auth";
import { replaceDocuments } from "@/lib/db/move-service";
import type { DocumentItem } from "@/lib/types";

export async function PUT(req: NextRequest) {
  const email = await getSessionEmail(req);
  if (!email) return unauthorized();

  try {
    const { documents } = (await req.json()) as {
      documents: (DocumentItem & { fileName?: string })[];
    };
    await replaceDocuments(email, documents ?? []);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("PUT /api/documents error:", error);
    return NextResponse.json({ error: "Failed to save documents" }, { status: 500 });
  }
}
