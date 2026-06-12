import { NextRequest, NextResponse } from "next/server";
import { getSessionEmail, unauthorized } from "@/lib/api-auth";
import { getUserData } from "@/lib/db/move-service";

export async function GET(req: NextRequest) {
  const email = await getSessionEmail(req);
  if (!email) return unauthorized();

  try {
    const data = await getUserData(email);
    if (!data) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json(data);
  } catch (error) {
    console.error("GET /api/data error:", error);
    return NextResponse.json({ error: "Failed to load data" }, { status: 500 });
  }
}
