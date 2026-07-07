import { NextRequest, NextResponse } from "next/server";
import { requireMoveAccess } from "@/lib/api-auth";
import { getMoveForUser } from "@/lib/db/move-access";
import { resolveRequestLocale } from "@/lib/api-errors";
import { translate } from "@/lib/i18n";

export async function GET(req: NextRequest) {
  const locale = resolveRequestLocale(req);
  const result = await requireMoveAccess(req);
  if (result instanceof NextResponse) return result;

  const q = req.nextUrl.searchParams.get("q")?.trim().toLowerCase();
  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const moveData = await getMoveForUser(result.user.id);
  if (!moveData) return NextResponse.json({ results: [] });

  const { move } = moveData;
  const results: {
    type: string;
    id: string;
    title: string;
    subtitle?: string;
    href: string;
  }[] = [];

  for (const task of move.checklistTasks) {
    if (task.title.toLowerCase().includes(q) || task.category.toLowerCase().includes(q)) {
      results.push({
        type: "task",
        id: task.id,
        title: task.title,
        subtitle: task.category,
        href: `/checklist?task=${task.id}`,
      });
    }
  }

  for (const box of move.inventoryBoxes) {
    if (
      box.contents.toLowerCase().includes(q) ||
      box.room.toLowerCase().includes(q) ||
      String(box.boxNumber).includes(q)
    ) {
      results.push({
        type: "box",
        id: box.id,
        title: translate(locale, "search.boxLabel", { number: box.boxNumber }),
        subtitle: `${box.room} — ${box.contents}`,
        href: `/inventory?box=${box.boxNumber}`,
      });
    }
  }

  for (const doc of move.documents) {
    if (
      doc.name.toLowerCase().includes(q) ||
      doc.category.toLowerCase().includes(q) ||
      (doc.fileName?.toLowerCase().includes(q) ?? false)
    ) {
      results.push({
        type: "document",
        id: doc.id,
        title: doc.name,
        subtitle: doc.category,
        href: "/documents",
      });
    }
  }

  for (const item of move.budgetItems) {
    if (item.category.toLowerCase().includes(q)) {
      results.push({
        type: "budget",
        id: item.id,
        title: item.category,
        subtitle: translate(locale, "search.budgetEst", { amount: item.estimated }),
        href: "/budget",
      });
    }
  }

  return NextResponse.json({ results: results.slice(0, 20) });
}
