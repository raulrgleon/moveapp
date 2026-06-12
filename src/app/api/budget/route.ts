import { NextRequest, NextResponse } from "next/server";
import { getSessionEmail, unauthorized } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { syncBudgetEstimate } from "@/lib/db/move-service";
import { estimateBudget } from "@/lib/budget/estimator";
import type { MoveProfile } from "@/lib/move-profile";

export async function GET(req: NextRequest) {
  const email = await getSessionEmail(req);
  if (!email) return unauthorized();

  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      moves: {
        take: 1,
        orderBy: { updatedAt: "desc" },
        include: { budgetItems: { orderBy: { sortOrder: "asc" } } },
      },
    },
  });

  const move = user?.moves[0];
  if (!move) {
    return NextResponse.json({ items: [], totalEstimated: 0, totalActual: 0, notes: [] });
  }

  let items = move.budgetItems;
  if (items.length === 0) {
    const profile: MoveProfile = {
      name: user!.name,
      email: user!.email,
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
    };
    const est = await syncBudgetEstimate(move.id, profile);
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
    });
  }

  const totalEstimated = items.reduce((s, i) => s + i.estimated, 0);
  const totalActual = items.reduce((s, i) => s + i.actual, 0);
  const est = estimateBudget({
    name: user!.name,
    email: user!.email,
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
  });

  return NextResponse.json({
    items,
    totalEstimated,
    totalActual,
    notes: est.notes,
  });
}

export async function PATCH(req: NextRequest) {
  const email = await getSessionEmail(req);
  if (!email) return unauthorized();

  const body = (await req.json()) as {
    items?: { id: string; actual?: number }[];
    recalculate?: boolean;
  };

  const user = await prisma.user.findUnique({
    where: { email },
    include: { moves: { take: 1, orderBy: { updatedAt: "desc" } } },
  });
  const move = user?.moves[0];
  if (!move) return NextResponse.json({ error: "No move" }, { status: 404 });

  if (body.recalculate) {
    const profile: MoveProfile = {
      name: user!.name,
      email: user!.email,
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
    };
    await syncBudgetEstimate(move.id, profile);
  }

  if (body.items) {
    for (const item of body.items) {
      if (item.actual !== undefined) {
        await prisma.budgetItem.update({
          where: { id: item.id },
          data: { actual: item.actual },
        });
      }
    }
  }

  return GET(req);
}
