import { NextRequest, NextResponse } from "next/server";
import { requireCanEditData, requireMoveAccess } from "@/lib/api-auth";
import { jsonErrorFromRequest, resolveRequestLocale } from "@/lib/api-errors";
import { canEditMoveData } from "@/lib/db/move-access";
import { syncBudgetEstimate } from "@/lib/db/move-service";
import { resolveBudgetRouteContext } from "@/lib/budget/route-context";
import { estimateBudget } from "@/lib/budget/estimator";
import { mergeLiveBudgetItems } from "@/lib/budget/merge-items";
import { buildBudgetBreakdowns } from "@/lib/budget/breakdown";
import { logMoveActivity } from "@/lib/db/activity";
import { prisma } from "@/lib/prisma";
import { requireProSubscription } from "@/lib/billing/require-pro";
import type { MoveProfile } from "@/lib/move-profile";

function buildProfile(
  move: {
    origin: string;
    destination: string;
    moveDate: Date;
    household: string;
    pets: boolean;
    petDetails: string | null;
    budget: number;
    rentalPreference: string;
    needsHousingHelp: boolean;
    needsVehicleTransport: boolean;
    originLat: number | null;
    originLon: number | null;
    destinationLat: number | null;
    destinationLon: number | null;
    truckChoice: string | null;
    vehicleTransportChoice: string | null;
  },
  user: { name: string; email: string }
): MoveProfile {
  return {
    name: user.name,
    email: user.email,
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
}

export async function GET(req: NextRequest) {
  const locale = resolveRequestLocale(req);
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
    return NextResponse.json({
      items: [],
      totalEstimated: 0,
      totalActual: 0,
      notes: [],
      budgetTarget: 0,
    });
  }

  const profile = buildProfile(move, move.user);

  if (move.budgetItems.length === 0 && canEditMoveData(result.access.role)) {
    await syncBudgetEstimate(move.id, profile, move.selectedRouteIndex ?? 0, 1, locale);
  }

  const dbItems = await prisma.budgetItem.findMany({
    where: { moveId: move.id },
    orderBy: { sortOrder: "asc" },
  });

  const routeCtx = await resolveBudgetRouteContext(
    move.id,
    profile,
    move.selectedRouteIndex ?? 0
  );
  const live = await estimateBudget(profile, {
    distanceMiles: routeCtx.distanceMiles,
    durationHours: routeCtx.durationHours,
    routeStops: routeCtx.routeStops,
    vehicleCount: Math.max(1, routeCtx.vehicles.length),
    vehicles: routeCtx.vehicles,
    truckChoice: move.truckChoice,
    vehicleTransportChoice: move.vehicleTransportChoice,
    locale,
  });

  const items = mergeLiveBudgetItems(
    dbItems.map((row) => ({
      id: row.id,
      category: row.category,
      estimated: row.estimated,
      actual: row.actual,
      cheapestOption: row.cheapestOption,
      sortOrder: row.sortOrder,
    })),
    live.items
  );

  const totalEstimated = items.reduce((s, i) => s + i.estimated, 0);
  const totalActual = items.reduce((s, i) => s + i.actual, 0);

  const breakdowns = buildBudgetBreakdowns(profile, items, {
    distanceMiles: routeCtx.distanceMiles,
    durationHours: routeCtx.durationHours,
    routeStops: routeCtx.routeStops,
    vehicles: routeCtx.vehicles,
    truckChoice: move.truckChoice,
    vehicleTransportChoice: move.vehicleTransportChoice,
    locale,
  });

  return NextResponse.json({
    items,
    totalEstimated,
    totalActual,
    notes: live.notes,
    breakdowns,
    distanceMiles: routeCtx.distanceMiles,
    budgetTarget: move.budget,
    truckChoice: move.truckChoice,
    vehicleTransportChoice: move.vehicleTransportChoice,
    selectedRouteIndex: move.selectedRouteIndex ?? 0,
    isEstimate: true,
  });
}

export async function PATCH(req: NextRequest) {
  const proCheck = await requireProSubscription(req);
  if (proCheck instanceof NextResponse) return proCheck;
  const locale = resolveRequestLocale(req);
  const result = await requireMoveAccess(req);
  if (result instanceof NextResponse) return result;

  const denied = requireCanEditData(result.access);
  if (denied) return denied;

  const body = (await req.json()) as {
    items?: { id: string; actual?: number }[];
    recalculate?: boolean;
    routeIndex?: number;
  };

  const move = await prisma.move.findUnique({
    where: { id: result.access.moveId },
    include: { user: { select: { name: true, email: true } } },
  });
  if (!move) return jsonErrorFromRequest(req, "noMove", 404);

  if (body.recalculate && canEditMoveData(result.access.role)) {
    const profile = buildProfile(move, move.user);
    const vehicles = await prisma.vehicle.findMany({ where: { moveId: move.id } });
    const routeIndex = typeof body.routeIndex === "number" ? body.routeIndex : 0;
    await syncBudgetEstimate(
      move.id,
      profile,
      routeIndex,
      Math.max(1, vehicles.length),
      locale
    );
  }

  if (body.items) {
    for (const item of body.items) {
      if (item.actual !== undefined) {
        const updated = await prisma.budgetItem.updateMany({
          where: { id: item.id, moveId: move.id },
          data: { actual: item.actual },
        });
        if (updated.count === 0) {
          return NextResponse.json({ error: "Budget item not found" }, { status: 404 });
        }
      }
    }
    await logMoveActivity(move.id, result.user.id, "budget_updated");
  }

  return GET(req);
}
