import { NextRequest, NextResponse } from "next/server";
import { requireMoveAccess } from "@/lib/api-auth";
import { requireProSubscription } from "@/lib/billing/require-pro";
import { getMoveForUser } from "@/lib/db/move-access";

function icsEscape(text: string) {
  return text.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");
}

function formatIcsDate(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`;
}

export async function GET(req: NextRequest) {
  const proCheck = await requireProSubscription(req);
  if (proCheck instanceof NextResponse) return proCheck;
  const result = await requireMoveAccess(req);
  if (result instanceof NextResponse) return result;

  const moveData = await getMoveForUser(result.user.id);
  if (!moveData) {
    return NextResponse.json({ error: "Move not found" }, { status: 404 });
  }

  const { move } = moveData;
  const moveDate = formatIcsDate(move.moveDate);
  const now = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  const events: string[] = [];

  events.push([
    "BEGIN:VEVENT",
    `UID:move-${move.id}@movepilot`,
    `DTSTAMP:${now}`,
    `DTSTART;VALUE=DATE:${moveDate}`,
    `SUMMARY:${icsEscape(`Move day: ${move.origin} → ${move.destination}`)}`,
    "END:VEVENT",
  ].join("\r\n"));

  for (const task of move.checklistTasks) {
    if (!task.dueDate) continue;
    const due = formatIcsDate(task.dueDate);
    events.push([
      "BEGIN:VEVENT",
      `UID:task-${task.id}@movepilot`,
      `DTSTAMP:${now}`,
      `DTSTART;VALUE=DATE:${due}`,
      `SUMMARY:${icsEscape(task.title)}`,
      `DESCRIPTION:${icsEscape(task.category)}`,
      "END:VEVENT",
    ].join("\r\n"));
  }

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//MovePilot//Moving Plan//EN",
    "CALSCALE:GREGORIAN",
    ...events,
    "END:VCALENDAR",
  ].join("\r\n");

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": "attachment; filename=move-plan.ics",
    },
  });
}
