import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import {
  requireCanEditData,
  requireMoveAccess,
} from "@/lib/api-auth";
import { jsonError, jsonErrorFromRequest, resolveRequestLocale } from "@/lib/api-errors";
import {
  addChecklistTask,
  deleteChecklistTask,
  patchChecklistTask,
  replaceChecklist,
} from "@/lib/db/move-service";
import { requireProSubscription } from "@/lib/billing/require-pro";
import type { ChecklistTask } from "@/lib/types";

export async function PUT(req: NextRequest) {
  const proCheck = await requireProSubscription(req);
  if (proCheck instanceof NextResponse) return proCheck;
  const locale = resolveRequestLocale(req);
  const result = await requireMoveAccess(req);
  if (result instanceof NextResponse) return result;

  const denied = requireCanEditData(result.access);
  if (denied) return denied;

  try {
    const { tasks } = (await req.json()) as { tasks: ChecklistTask[] };
    await replaceChecklist(result.user.id, tasks ?? []);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("PUT /api/checklist error:", error);
    return jsonError("saveFailed", 500, locale);
  }
}

export async function POST(req: NextRequest) {
  const proCheck = await requireProSubscription(req);
  if (proCheck instanceof NextResponse) return proCheck;
  const locale = resolveRequestLocale(req);
  const result = await requireMoveAccess(req);
  if (result instanceof NextResponse) return result;

  const denied = requireCanEditData(result.access);
  if (denied) return denied;

  try {
    const body = (await req.json()) as Partial<ChecklistTask>;
    if (!body.title?.trim()) {
      return jsonErrorFromRequest(req, "invalidInput", 400);
    }

    const created = await addChecklistTask(result.user.id, {
      id: randomUUID(),
      title: body.title.trim(),
      category: body.category?.trim() || "Planning",
      status: body.status ?? "pending",
      dueDate: body.dueDate ?? "",
      priority: body.priority ?? "medium",
      notes: body.notes,
      assigneeEmail: body.assigneeEmail,
    });

    return NextResponse.json({
      task: {
        id: created.id,
        title: created.title,
        category: created.category,
        status: created.status,
        dueDate: created.dueDate ? created.dueDate.toISOString().slice(0, 10) : "",
        priority: created.priority,
        notes: created.notes ?? undefined,
        assigneeEmail: created.assigneeEmail ?? undefined,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("POST /api/checklist error:", error);
    return jsonError("saveFailed", 500, locale);
  }
}

export async function PATCH(req: NextRequest) {
  const proCheck = await requireProSubscription(req);
  if (proCheck instanceof NextResponse) return proCheck;
  const locale = resolveRequestLocale(req);
  const result = await requireMoveAccess(req);
  if (result instanceof NextResponse) return result;

  const denied = requireCanEditData(result.access);
  if (denied) return denied;

  try {
    const body = (await req.json()) as { id?: string } & Partial<ChecklistTask>;
    if (!body.id) return jsonError("idRequired", 400, locale);

    const updated = await patchChecklistTask(result.user.id, body.id, {
      status: body.status,
      notes: body.notes,
      assigneeEmail: body.assigneeEmail,
      title: body.title,
      category: body.category,
      dueDate: body.dueDate,
      priority: body.priority,
    });

    return NextResponse.json({
      task: {
        id: updated.id,
        title: updated.title,
        category: updated.category,
        status: updated.status,
        dueDate: updated.dueDate ? updated.dueDate.toISOString().slice(0, 10) : "",
        priority: updated.priority,
        notes: updated.notes ?? undefined,
        assigneeEmail: updated.assigneeEmail ?? undefined,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("not found")) return jsonError("taskNotFound", 404, locale);
    console.error("PATCH /api/checklist error:", error);
    return jsonError("saveFailed", 500, locale);
  }
}

export async function DELETE(req: NextRequest) {
  const proCheck = await requireProSubscription(req);
  if (proCheck instanceof NextResponse) return proCheck;
  const locale = resolveRequestLocale(req);
  const result = await requireMoveAccess(req);
  if (result instanceof NextResponse) return result;

  const denied = requireCanEditData(result.access);
  if (denied) return denied;

  let id = req.nextUrl.searchParams.get("id");
  if (!id) {
    try {
      const body = (await req.json()) as { id?: string };
      id = body.id ?? null;
    } catch {
      /* no body */
    }
  }
  if (!id) return jsonError("idRequired", 400, locale);

  try {
    await deleteChecklistTask(result.user.id, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("not found")) return jsonError("taskNotFound", 404, locale);
    console.error("DELETE /api/checklist error:", error);
    return jsonError("deleteFailed", 500, locale);
  }
}
