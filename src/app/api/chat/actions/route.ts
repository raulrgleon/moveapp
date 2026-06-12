import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { requireCanEditData, requireMoveAccess } from "@/lib/api-auth";
import { addChecklistTask, patchChecklistTask } from "@/lib/db/move-service";
export async function POST(req: NextRequest) {
  const result = await requireMoveAccess(req);
  if (result instanceof NextResponse) return result;

  const denied = requireCanEditData(result.access);
  if (denied) return denied;

  try {
    const body = (await req.json()) as {
      action?: string;
      taskId?: string;
      title?: string;
      category?: string;
      dueDate?: string;
      priority?: string;
    };

    const action = body.action?.trim();
    if (!action) {
      return NextResponse.json({ error: "action required" }, { status: 400 });
    }

    if (action === "complete_task") {
      const taskId = body.taskId?.trim();
      if (!taskId) {
        return NextResponse.json({ error: "taskId required" }, { status: 400 });
      }
      const updated = await patchChecklistTask(result.user.id, taskId, {
        status: "completed",
      });
      return NextResponse.json({
        ok: true,
        task: {
          id: updated.id,
          title: updated.title,
          status: updated.status,
        },
      });
    }

    if (action === "add_checklist_task") {
      const title = body.title?.trim();
      if (!title) {
        return NextResponse.json({ error: "title required" }, { status: 400 });
      }
      const created = await addChecklistTask(result.user.id, {
        id: randomUUID(),
        title,
        category: body.category?.trim() || "Planning",
        status: "pending",
        dueDate: body.dueDate ?? "",
        priority: (body.priority as "high" | "medium" | "low") ?? "medium",
      });
      return NextResponse.json({
        ok: true,
        task: {
          id: created.id,
          title: created.title,
          category: created.category,
        },
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("not found")) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }
    console.error("POST /api/chat/actions error:", error);
    return NextResponse.json({ error: "Action failed" }, { status: 500 });
  }
}
