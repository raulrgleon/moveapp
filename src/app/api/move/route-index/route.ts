import { NextRequest, NextResponse } from "next/server";
import { requireCanEditData, requireMoveAccess } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { syncBudgetEstimate } from "@/lib/db/move-service";
import { resolveBudgetRouteContext } from "@/lib/budget/route-context";
import { estimateBudget } from "@/lib/budget/estimator";
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
  const result = await requireMoveAccess(req);
  if (result instanceof NextResponse) return result;

  const move = await prisma.move.findUnique({
    where: { id: result.access.moveId },
    select: { selectedRouteIndex: true },
  });

  return NextResponse.json({
    routeIndex: move?.selectedRouteIndex ?? 0,
  });
}

export async function PATCH(req: NextRequest) {
  const result = await requireMoveAccess(req);
  if (result instanceof NextResponse) return result;

  const denied = requireCanEditData(result.access);
  if (denied) return denied;

  const body = (await req.json()) as { routeIndex?: number; syncBudget?: boolean };
  const routeIndex = typeof body.routeIndex === "number" ? Math.max(0, body.routeIndex) : 0;

  const move = await prisma.move.findUnique({
    where: { id: result.access.moveId },
    include: { user: { select: { name: true, email: true, locale: true } } },
  });
  if (!move) return NextResponse.json({ error: "No move" }, { status: 404 });

  const previousIndex = move.selectedRouteIndex ?? 0;

  if (routeIndex === previousIndex && body.syncBudget !== false) {
    return NextResponse.json({
      ok: true,
      routeIndex,
      budgetDelta: null,
      unchanged: true,
    });
  }

  const locale = move.user.locale === "es" ? "es" : "en";

  let budgetDelta: { previousEstimated: number; newEstimated: number; delta: number } | null = null;

  if (body.syncBudget !== false) {
    const profile = buildProfile(move, move.user);
    const oldCtx = await resolveBudgetRouteContext(move.id, profile, previousIndex);
    const oldEstimate = await estimateBudget(profile, {
      distanceMiles: oldCtx.distanceMiles,
      durationHours: oldCtx.durationHours,
      routeStops: oldCtx.routeStops,
      vehicleCount: Math.max(1, oldCtx.vehicles.length),
      vehicles: oldCtx.vehicles,
      truckChoice: move.truckChoice,
      vehicleTransportChoice: move.vehicleTransportChoice,
      locale,
    });

    await prisma.move.update({
      where: { id: move.id },
      data: { selectedRouteIndex: routeIndex },
    });

    const vehicles = await prisma.vehicle.findMany({ where: { moveId: move.id } });
    const estimate = await syncBudgetEstimate(
      move.id,
      profile,
      routeIndex,
      Math.max(1, vehicles.length),
      locale
    );

    budgetDelta = {
      previousEstimated: oldEstimate.totalEstimated,
      newEstimated: estimate.totalEstimated,
      delta: estimate.totalEstimated - oldEstimate.totalEstimated,
    };
  } else {
    await prisma.move.update({
      where: { id: move.id },
      data: { selectedRouteIndex: routeIndex },
    });
  }

  return NextResponse.json({
    ok: true,
    routeIndex,
    budgetDelta,
  });
}
