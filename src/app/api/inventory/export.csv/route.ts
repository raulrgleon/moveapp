import { NextRequest, NextResponse } from "next/server";
import { requireMoveAccess } from "@/lib/api-auth";
import { requireProSubscription } from "@/lib/billing/require-pro";
import { getMoveForUser } from "@/lib/db/move-access";

function csvEscape(value: string) {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
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

  const boxes = moveData.move.inventoryBoxes;
  const header = "box_number,origin_room,destination_room,contents,status,fragile,essentials,size,weight_lbs,assignee,created_at,updated_at";
  const rows = boxes.map((b) =>
    [
      b.boxNumber,
      csvEscape(b.room),
      csvEscape(b.destinationRoom ?? b.room),
      csvEscape(b.contents),
      b.status,
      b.fragile ? "yes" : "no",
      b.essentials ? "yes" : "no",
      b.sizeEstimate ?? "",
      b.weightLbs ?? "",
      csvEscape(b.assigneeEmail ?? ""),
      b.createdAt.toISOString(),
      b.updatedAt.toISOString(),
    ].join(",")
  );

  const csv = [header, ...rows].join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=inventory.csv",
    },
  });
}
