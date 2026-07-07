import { NextRequest, NextResponse } from "next/server";
import { jsonErrorFromRequest } from "@/lib/api-errors";
import { processDueReminders } from "@/lib/notifications/reminders";
import { processActionReminders } from "@/lib/notifications/action-reminders";

export async function POST(req: NextRequest) {
  const secret = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return jsonErrorFromRequest(req, "unauthorized", 401);
  }

  const tasks = await processDueReminders();
  const actions = await processActionReminders();
  return NextResponse.json({ ...tasks, actionReminders: actions.sent });
}
