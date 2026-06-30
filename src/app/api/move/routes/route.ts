import { NextRequest, NextResponse } from "next/server";
import { requireMoveAccess } from "@/lib/api-auth";
import {
  estimateStopCount,
  formatDriveTime,
} from "@/lib/geo/route-service";
import { computeFuelStopMarkers } from "@/lib/geo/fuel-stop-planner";
import {
  ensureMoveRoutes,
  loadStoredMoveRoutes,
  storedRoutesMatchMove,
  syncMoveRoutesGeometry,
} from "@/lib/geo/move-routes-sync";
import { loadVehiclesWithMpg } from "@/lib/budget/route-context";
import { prisma } from "@/lib/prisma";

function stopCountForAlternative(
  alt: { distanceMiles: number; durationHours: number },
  pets: boolean,
  rentalPreference: string,
  vehicles: Awaited<ReturnType<typeof loadVehiclesWithMpg>>
): number {
  const fuelStopCount = computeFuelStopMarkers({
    distanceMiles: alt.distanceMiles,
    rentalPreference,
    vehicles,
    vehicleCount: Math.max(1, vehicles.length),
  }).length;
  return estimateStopCount(alt.distanceMiles, alt.durationHours, pets, fuelStopCount);
}

/** Returns persisted route alternatives + stops for the active move. */
export async function GET(req: NextRequest) {
  const result = await requireMoveAccess(req);
  if (result instanceof NextResponse) return result;

  const { access, user } = result;
  const locale = user.locale === "es" ? "es" : "en";
  const force = req.nextUrl.searchParams.get("refresh") === "1";

  const move = await prisma.move.findUnique({
    where: { id: access.moveId },
    select: {
      originLat: true,
      originLon: true,
      destinationLat: true,
      destinationLon: true,
      selectedRouteIndex: true,
      pets: true,
      rentalPreference: true,
    },
  });

  if (
    !move ||
    move.originLat == null ||
    move.originLon == null ||
    move.destinationLat == null ||
    move.destinationLon == null
  ) {
    return NextResponse.json({ error: "Route coordinates required" }, { status: 400 });
  }

  let stored = force ? null : await loadStoredMoveRoutes(access.moveId);

  if (stored && !storedRoutesMatchMove(stored, move)) {
    stored = null;
  }

  if (stored && !stored.interstateMetadataReady) {
    stored = null;
  }

  if (!stored) {
    const synced = await syncMoveRoutesGeometry(access.moveId, locale);
    if (!synced) {
      return NextResponse.json({ error: "Could not compute route" }, { status: 502 });
    }
  }

  stored = await ensureMoveRoutes(access.moveId, locale);

  if (!stored) {
    return NextResponse.json({ error: "No routes stored" }, { status: 404 });
  }

  const routeIndex = move.selectedRouteIndex ?? 0;
  const selected =
    stored.alternatives.find((alt) => alt.index === routeIndex) ??
    stored.alternatives[routeIndex] ??
    stored.alternatives[0];

  const vehicles = await loadVehiclesWithMpg(access.moveId);
  const stopCount = selected
    ? stopCountForAlternative(selected, move.pets, move.rentalPreference, vehicles)
    : 0;

  return NextResponse.json({
    alternatives: stored.alternatives,
    stopsByIndex: stored.stopsByIndex,
    selectedRouteIndex: routeIndex,
    distanceMiles: selected?.distanceMiles ?? 0,
    durationHours: selected?.durationHours ?? 0,
    driveTimeLabel: selected?.driveTimeLabel ?? formatDriveTime(0),
    stopCount,
    stopsPending: false,
    computedAt: stored.computedAt,
  });
}
