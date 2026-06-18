import { drivenVehicleCount } from "@/lib/budget/fuel-cost";
import { resolveBudgetRouteContext } from "@/lib/budget/route-context";
import type { MoveProfile } from "@/lib/move-profile";
import { parseRentalPreferenceKey } from "@/lib/move-profile";
import {
  buildMoveBrief,
  estimateInventoryWeightLbs,
  type MoveBrief,
} from "@/lib/partner/move-brief";
import { prisma } from "@/lib/prisma";

export async function resolveMoveBriefForPartner(
  moveId: string,
  profile: MoveProfile,
  routeIndex = 0
): Promise<MoveBrief> {
  const [routeCtx, move, inventoryBoxes] = await Promise.all([
    resolveBudgetRouteContext(moveId, profile, routeIndex),
    prisma.move.findUnique({
      where: { id: moveId },
      select: {
        origin: true,
        destination: true,
        moveDate: true,
        household: true,
        pets: true,
        rentalPreference: true,
        budgetItems: { select: { estimated: true, category: true } },
      },
    }),
    prisma.inventoryBox.findMany({
      where: { moveId },
      select: { weightLbs: true, sizeEstimate: true, fragile: true },
    }),
  ]);

  if (!move) {
    throw new Error("Move not found");
  }

  const boxCount = inventoryBoxes.length;
  const fragileCount = inventoryBoxes.filter((b) => b.fragile).length;
  const estWeightLbs = Math.round(estimateInventoryWeightLbs(inventoryBoxes));
  const vehicles = routeCtx.vehicles;
  const drivingCount = drivenVehicleCount(
    parseRentalPreferenceKey(move.rentalPreference),
    Math.max(1, vehicles.length),
    vehicles
  );

  const budgetEstimate = move.budgetItems.reduce((sum, item) => sum + item.estimated, 0);
  const fuelItem = move.budgetItems.find((item) => item.category.toLowerCase().includes("fuel"));
  const fuelEstimate = fuelItem?.estimated ?? 0;

  return buildMoveBrief({
    origin: move.origin,
    destination: move.destination,
    moveDate: move.moveDate.toISOString().slice(0, 10),
    household: move.household,
    pets: move.pets,
    rentalPreference: move.rentalPreference,
    distanceMiles: routeCtx.distanceMiles,
    durationHours: routeCtx.durationHours,
    boxCount,
    estWeightLbs,
    fragileCount,
    vehicleCount: vehicles.length,
    drivingVehicleCount: drivingCount,
    vehicles,
    budgetEstimate,
    diyEstimate: budgetEstimate,
    fuelEstimate,
  });
}

export function serializeQuote(quote: {
  id: string;
  companyName: string;
  contactEmail: string;
  contactPhone: string | null;
  amount: number | null;
  amountMin?: number | null;
  amountMax?: number | null;
  message: string | null;
  serviceType?: string | null;
  includesPacking?: boolean;
  includesInsurance?: boolean;
  usdotNumber?: string | null;
  availableDate?: string | null;
  status: string;
  createdAt: Date;
}) {
  return {
    id: quote.id,
    companyName: quote.companyName,
    contactEmail: quote.contactEmail,
    contactPhone: quote.contactPhone,
    amount: quote.amount,
    amountMin: quote.amountMin ?? null,
    amountMax: quote.amountMax ?? null,
    message: quote.message,
    serviceType: quote.serviceType ?? null,
    includesPacking: quote.includesPacking ?? false,
    includesInsurance: quote.includesInsurance ?? false,
    usdotNumber: quote.usdotNumber ?? null,
    availableDate: quote.availableDate ?? null,
    status: quote.status,
    createdAt: quote.createdAt.toISOString(),
  };
}
