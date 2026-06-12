import { NextResponse } from "next/server";
import { getActiveAnnouncements } from "@/lib/admin/announcements";

export async function GET() {
  const announcements = await getActiveAnnouncements();
  return NextResponse.json({ announcements });
}
