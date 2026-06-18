import { NextRequest, NextResponse } from "next/server";
import { processDueReminders } from "@/lib/notifications/reminders";
import { processActionReminders } from "@/lib/notifications/action-reminders";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tasks = await processDueReminders();
  const actions = await processActionReminders();
  return NextResponse.json({ ...tasks, actionReminders: actions.sent });
}
