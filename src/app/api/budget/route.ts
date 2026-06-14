import { NextRequest, NextResponse } from "next/server";
import { requireCanEditData, requireMoveAccess } from "@/lib/api-auth";
import { syncBudgetEstimate } from "@/lib/db/move-service";
import { estimateBudget } from "@/lib/budget/estimator";
import { resolveRouteDistanceMiles } from "@/lib/geo/route-service";
import { logMoveActivity } from "@/lib/db/activity";
import { prisma } from "@/lib/prisma";
import type { MoveProfile } from "@/lib/move-profile";

export async function GET(req: NextRequest) {
  const result = await requireMoveAccess(req);
  if (result instanceof NextResponse) return result;

  const move = await prisma.move.findUnique({
    where: { id: result.access.moveId },
    include: {
      budgetItems: { orderBy: { sortOrder: "asc" } },
      user: { select: { name: true, email: true } },
    },
  });

  if (!move) {
    return NextResponse.json({ items: [], totalEstimated: 0, totalActual: 0, notes: [] });
  }

  let items = move.budgetItems;
  if (items.length === 0) {
    const profile: MoveProfile = {
      name: move.user.name,
      email: move.user.email,
      origin: move.origin,
      destination: move.destination,
      moveDate: move.moveDate.toISOString().slice(0, 10),
      household: move.household,
      pets: move.pets,
      petDetails: move.petDetails ?? "",
      budget: move.budget,
      rentalPreference: move.rentalPreference,
      needsHousingHelp: move.needsHousingHelp,
      needsVehicleTransport: move.needsVehicleTransport,
      originLat: move.originLat ?? undefined,
      originLon: move.originLon ?? undefined,
      destinationLat: move.destinationLat ?? undefined,
      destinationLon: move.destinationLon ?? undefined,
    };
    const est = await syncBudgetEstimate(move.id, profile);
    const distanceMiles = await resolveRouteDistanceMiles(profile);
    items = est.items.map((i, idx) => ({
      id: `temp-${idx}`,
      moveId: move.id,
      category: i.category,
      estimated: i.estimated,
      actual: 0,
      cheapestOption: i.cheapestOption ?? null,
      notes: null,
      sortOrder: i.sortOrder,
    }));
    return NextResponse.json({
      items,
      totalEstimated: est.totalEstimated,
      totalActual: 0,
      notes: est.notes,
      distanceMiles,
      isEstimate: true,
    });
  }

  const totalEstimated = items.reduce((s, i) => s + i.estimated, 0);
  const totalActual = items.reduce((s, i) => s + i.actual, 0);
  const est = estimateBudget({
    name: move.user.name,
    email: move.user.email,
    origin: move.origin,
    destination: move.destination,
    moveDate: move.moveDate.toISOString().slice(0, 10),
    household: move.household,
    pets: move.pets,
    petDetails: move.petDetails ?? "",
    budget: move.budget,
    rentalPreference: move.rentalPreference,
    needsHousingHelp: move.needsHousingHelp,
    needsVehicleTransport: move.needsVehicleTransport,
    originLat: move.originLat ?? undefined,
    originLon: move.originLon ?? undefined,
    destinationLat: move.destinationLat ?? undefined,
    destinationLon: move.destinationLon ?? undefined,
  });

  const distanceMiles = await resolveRouteDistanceMiles({
    name: move.user.name,
    email: move.user.email,
    origin: move.origin,
    destination: move.destination,
    moveDate: move.moveDate.toISOString().slice(0, 10),
    household: move.household,
    pets: move.pets,
    petDetails: move.petDetails ?? "",
    budget: move.budget,
    rentalPreference: move.rentalPreference,
    needsHousingHelp: move.needsHousingHelp,
    needsVehicleTransport: move.needsVehicleTransport,
    originLat: move.originLat ?? undefined,
    originLon: move.originLon ?? undefined,
    destinationLat: move.destinationLat ?? undefined,
    destinationLon: move.destinationLon ?? undefined,
  });

  return NextResponse.json({
    items,
    totalEstimated,
    totalActual,
    notes: est.notes,
    distanceMiles,
    isEstimate: true,
  });
}

export async function PATCH(req: NextRequest) {
  const result = await requireMoveAccess(req);
  if (result instanceof NextResponse) return result;

  const denied = requireCanEditData(result.access);
  if (denied) return denied;

  const body = (await req.json()) as {
    items?: { id: string; actual?: number }[];
    recalculate?: boolean;
  };

  const move = await prisma.move.findUnique({
    where: { id: result.access.moveId },
    include: { user: { select: { name: true, email: true } } },
  });
  if (!move) return NextResponse.json({ error: "No move" }, { status: 404 });

  if (body.recalculate && result.access.role === "owner") {
    const profile: MoveProfile = {
      name: move.user.name,
      email: move.user.email,
      origin: move.origin,
      destination: move.destination,
      moveDate: move.moveDate.toISOString().slice(0, 10),
      household: move.household,
      pets: move.pets,
      petDetails: move.petDetails ?? "",
      budget: move.budget,
      rentalPreference: move.rentalPreference,
      needsHousingHelp: move.needsHousingHelp,
      needsVehicleTransport: move.needsVehicleTransport,
      originLat: move.originLat ?? undefined,
      originLon: move.originLon ?? undefined,
      destinationLat: move.destinationLat ?? undefined,
      destinationLon: move.destinationLon ?? undefined,
    };
    await syncBudgetEstimate(move.id, profile);
  }

  if (body.items) {
    for (const item of body.items) {
      if (item.actual !== undefined) {
        await prisma.budgetItem.updateMany({
          where: { id: item.id, moveId: move.id },
          data: { actual: item.actual },
        });
      }
    }
    await logMoveActivity(move.id, result.user.id, "budget_updated");
  }

  return GET(req);
}
