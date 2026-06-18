import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveBudgetRouteContext } from "@/lib/budget/route-context";
import { estimateBudget } from "@/lib/budget/estimator";
import { mergeLiveBudgetItems } from "@/lib/budget/merge-items";
import type { MoveProfile } from "@/lib/move-profile";

export async function GET(
  _req: NextRequest,
  { params }: { params: { token: string } }
) {
  const move = await prisma.move.findFirst({
    where: { planShareToken: params.token, planShareEnabled: true },
    include: {
      budgetItems: { orderBy: { sortOrder: "asc" } },
      user: { select: { name: true } },
    },
  });

  if (!move) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const profile: MoveProfile = {
    name: move.user.name,
    email: "",
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

  const routeCtx = await resolveBudgetRouteContext(move.id, profile, move.selectedRouteIndex);
  const live = await estimateBudget(profile, {
    distanceMiles: routeCtx.distanceMiles,
    durationHours: routeCtx.durationHours,
    routeStops: routeCtx.routeStops,
    vehicleCount: Math.max(1, routeCtx.vehicles.length),
    vehicles: routeCtx.vehicles,
    truckChoice: move.truckChoice,
    vehicleTransportChoice: move.vehicleTransportChoice,
    locale: "en",
  });

  const items = mergeLiveBudgetItems(
    move.budgetItems.map((row) => ({
      id: row.id,
      category: row.category,
      estimated: row.estimated,
      actual: row.actual,
      cheapestOption: row.cheapestOption,
      sortOrder: row.sortOrder,
    })),
    live.items
  );

  return NextResponse.json({
    ownerName: move.user.name.split(" ")[0],
    origin: move.origin,
    destination: move.destination,
    moveDate: profile.moveDate,
    truckChoice: move.truckChoice,
    distanceMiles: routeCtx.distanceMiles,
    driveTimeLabel: routeCtx.durationHours
      ? `${Math.floor(routeCtx.durationHours)}h ${Math.round((routeCtx.durationHours % 1) * 60)}m`
      : null,
    selectedRouteIndex: move.selectedRouteIndex,
    items: items.map((i) => ({
      category: i.category,
      estimated: i.estimated,
      cheapestOption: i.cheapestOption,
    })),
    totalEstimated: items.reduce((s, i) => s + i.estimated, 0),
    budgetTarget: move.budget,
  });
}
