import { NextRequest, NextResponse } from "next/server";
import { jsonErrorFromRequest } from "@/lib/api-errors";
import { randomUUID } from "crypto";
import { requireCanEditData, requireMoveAccess } from "@/lib/api-auth";
import {
  addChecklistTask,
  patchChecklistTask,
} from "@/lib/db/move-service";
import { requireProSubscription } from "@/lib/billing/require-pro";
import { prisma } from "@/lib/prisma";

type ActionBody = {
  action?: string;
  taskId?: string;
  title?: string;
  category?: string;
  dueDate?: string;
  priority?: string;
  status?: string;
  budgetItemId?: string;
  categoryName?: string;
  actual?: number;
};

export async function POST(req: NextRequest) {
  const proCheck = await requireProSubscription(req);
  if (proCheck instanceof NextResponse) return proCheck;
  const result = await requireMoveAccess(req);
  if (result instanceof NextResponse) return result;

  const denied = requireCanEditData(result.access);
  if (denied) return denied;

  try {
    const body = (await req.json()) as ActionBody;
    const action = body.action?.trim();
    if (!action) {
      return NextResponse.json({ error: "action required" }, { status: 400 });
    }

    if (action === "complete_task") {
      const taskId = body.taskId?.trim();
      if (!taskId) return NextResponse.json({ error: "taskId required" }, { status: 400 });
      const updated = await patchChecklistTask(result.user.id, taskId, { status: "completed" });
      return NextResponse.json({
        ok: true,
        label: updated.title,
        task: { id: updated.id, title: updated.title, status: updated.status },
      });
    }

    if (action === "set_task_status") {
      const taskId = body.taskId?.trim();
      const status = body.status as "pending" | "in_progress" | "completed" | undefined;
      if (!taskId || !status) {
        return NextResponse.json({ error: "taskId and status required" }, { status: 400 });
      }
      const updated = await patchChecklistTask(result.user.id, taskId, { status });
      return NextResponse.json({
        ok: true,
        label: updated.title,
        task: { id: updated.id, title: updated.title, status: updated.status },
      });
    }

    if (action === "add_checklist_task") {
      const title = body.title?.trim();
      if (!title) return NextResponse.json({ error: "title required" }, { status: 400 });
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
        label: created.title,
        task: { id: created.id, title: created.title, category: created.category },
      });
    }

    if (action === "update_budget_actual") {
      const actual = body.actual;
      if (actual == null || !Number.isFinite(actual) || actual < 0) {
        return NextResponse.json({ error: "valid actual required" }, { status: 400 });
      }

      let itemId = body.budgetItemId?.trim();
      if (!itemId && body.categoryName?.trim()) {
        const match = await prisma.budgetItem.findFirst({
          where: {
            moveId: result.access.moveId,
            category: { contains: body.categoryName.trim(), mode: "insensitive" },
          },
        });
        itemId = match?.id;
      }

      if (!itemId) {
        return NextResponse.json({ error: "budget item not found" }, { status: 404 });
      }

      const updated = await prisma.budgetItem.updateMany({
        where: { id: itemId, moveId: result.access.moveId },
        data: { actual: Math.round(actual) },
      });

      if (updated.count === 0) {
        return NextResponse.json({ error: "budget item not found" }, { status: 404 });
      }

      const item = await prisma.budgetItem.findUnique({ where: { id: itemId } });
      return NextResponse.json({
        ok: true,
        label: item?.category ?? "Budget",
        budgetItem: item,
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("not found")) {
      return jsonErrorFromRequest(req, "notFound", 404);
    }
    console.error("POST /api/chat/actions error:", error);
    return NextResponse.json({ error: "Action failed" }, { status: 500 });
  }
}
