import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({ ok: true, status: "healthy" });
  } catch (error) {
    console.error("Health check failed:", error);
    return NextResponse.json({ ok: false, status: "unhealthy" }, { status: 503 });
  }
}
