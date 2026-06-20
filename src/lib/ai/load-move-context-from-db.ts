import type { MoveContextInput } from "@/lib/ai/move-context";
import { resolveBudgetRouteContext } from "@/lib/budget/route-context";
import type { MoveAccess } from "@/lib/db/move-access";
import type { Locale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import type { MoveProfile } from "@/lib/move-profile";

function moveToProfile(
  name: string,
  email: string,
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
  }
): MoveProfile {
  return {
    name,
    email,
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

function dbToVehicle(v: {
  id: string;
  year: string;
  make: string;
  model: string;
  displayLabel: string;
  needsTransport?: boolean;
  combMpg?: number | null;
  fuelType?: string | null;
}) {
  return {
    id: v.id,
    year: v.year,
    makeId: 0,
    make: v.make,
    modelId: 0,
    model: v.model,
    displayLabel: v.displayLabel,
    needsTransport: v.needsTransport ?? false,
    combMpg: v.combMpg ?? undefined,
    fuelType: v.fuelType ?? undefined,
  };
}

/** Load complete move context from DB — never trust client-sent profile data. */
export async function loadMoveContextFromDb(
  access: MoveAccess,
  opts: { locale?: Locale; userMessage?: string } = {}
): Promise<MoveContextInput | null> {
  const move = await prisma.move.findUnique({
    where: { id: access.moveId },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          locale: true,
          emailReminders: true,
          smsReminders: true,
          planTier: true,
          trialEndsAt: true,
          planPaidAt: true,
          createdAt: true,
        },
      },
      vehicles: true,
      inventoryBoxes: { orderBy: { boxNumber: "asc" } },
      checklistTasks: { orderBy: { dueDate: "asc" } },
      documents: { orderBy: { uploadedAt: "desc" } },
      budgetItems: { orderBy: { sortOrder: "asc" } },
      collaborators: { orderBy: { createdAt: "asc" } },
      partnerQuotes: { orderBy: { createdAt: "desc" }, take: 15 },
      activities: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });

  if (!move) return null;

  const profileName = access.role === "owner" ? move.user.name : move.user.name;
  const profile = moveToProfile(profileName, move.user.email, move);
  const vehicles = move.vehicles.map(dbToVehicle);
  const primaryVehicle = vehicles[0];

  let routeStats: MoveContextInput["routeStats"];
  try {
    const routeCtx = await resolveBudgetRouteContext(
      move.id,
      profile,
      move.selectedRouteIndex ?? 0
    );
    const completed = move.checklistTasks.filter((t) => t.status === "completed").length;
    const taskProgress = move.checklistTasks.length
      ? Math.round((completed / move.checklistTasks.length) * 100)
      : undefined;
    routeStats = {
      distanceMiles: routeCtx.distanceMiles,
      driveTimeLabel: routeCtx.durationHours
        ? `${routeCtx.durationHours.toFixed(1)}h`
        : undefined,
      totalEstimatedBudget: move.budgetItems.reduce((s, b) => s + b.estimated, 0),
      taskCompletionPercent: taskProgress,
    };
  } catch {
    routeStats = undefined;
  }

  const inventorySummary =
    move.inventoryBoxes.length > 0
      ? move.inventoryBoxes
          .map(
            (b) =>
              `#${b.boxNumber} ${b.room}→${b.destinationRoom ?? b.room} [${b.status}]${b.fragile ? " fragile" : ""}${b.essentials ? " essentials" : ""}: ${b.contents}`
          )
          .join("\n")
      : "none";

  const checklistSummary =
    move.checklistTasks.length > 0
      ? move.checklistTasks
          .map(
            (t) =>
              `${t.id} | ${t.status} | ${t.dueDate?.toISOString().slice(0, 10) ?? "no date"} | ${t.category} | ${t.title}${t.notes ? ` (${t.notes})` : ""}`
          )
          .join("\n")
      : "none";

  const budgetSummary =
    move.budgetItems.length > 0
      ? move.budgetItems
          .map(
            (b) =>
              `${b.id} | ${b.category} | est $${b.estimated} | actual $${b.actual}${b.cheapestOption ? ` | tip: ${b.cheapestOption}` : ""}${b.notes ? ` | ${b.notes}` : ""}`
          )
          .join("\n")
      : "none";

  const documentsSummary =
    move.documents.length > 0
      ? move.documents
          .map(
            (d) =>
              `${d.id} | ${d.category} | ${d.status} | ${d.name}${d.fileName ? ` (${d.fileName})` : ""}`
          )
          .join("\n")
      : "none";

  const collaboratorsSummary =
    move.collaborators.length > 0
      ? move.collaborators
          .map(
            (c) =>
              `${c.email} | role ${c.role} | ${c.acceptedAt ? "accepted" : "pending invite"}`
          )
          .join("\n")
      : "none";

  const partnerQuotesSummary =
    move.partnerQuotes.length > 0
      ? move.partnerQuotes
          .map(
            (q) =>
              `${q.companyName} | $${q.amount ?? "—"} | ${q.status} | ${q.contactEmail}${q.message ? ` | ${q.message.slice(0, 80)}` : ""}`
          )
          .join("\n")
      : "none";

  const recentActivitySummary =
    move.activities.length > 0
      ? move.activities
          .map(
            (a) =>
              `${a.createdAt.toISOString().slice(0, 10)} | ${a.action}${a.details ? ` | ${JSON.stringify(a.details)}` : ""}`
          )
          .join("\n")
      : "none";

  const utilityPicks =
    move.utilityPicks && typeof move.utilityPicks === "object"
      ? JSON.stringify(move.utilityPicks)
      : "none saved";

  const accountSummary = [
    `Owner: ${move.user.name} <${move.user.email}>`,
    `User ID: ${move.user.id}`,
    `Move ID: ${move.id}`,
    `Viewer role: ${access.role}`,
    `Phone: ${move.user.phone ?? "—"}`,
    `Locale: ${move.user.locale ?? "en"}`,
    `Plan: ${move.user.planTier}${move.user.trialEndsAt ? ` (trial until ${move.user.trialEndsAt.toISOString().slice(0, 10)})` : ""}`,
    `Email reminders: ${move.user.emailReminders ? "on" : "off"} | SMS: ${move.user.smsReminders ? "on" : "off"}`,
    `Account created: ${move.user.createdAt.toISOString().slice(0, 10)}`,
  ].join("\n");

  const moveMetaSummary = [
    `Truck choice: ${move.truckChoice ?? "—"}`,
    `Vehicle transport choice: ${move.vehicleTransportChoice ?? "—"}`,
    `Selected route index: ${move.selectedRouteIndex ?? 0}`,
    `Partner share: ${move.partnerShareEnabled ? "enabled" : "off"}`,
    `Plan share: ${move.planShareEnabled ? "enabled" : "off"}`,
    `Utility picks saved: ${utilityPicks}`,
    `Supply checks: ${move.supplyChecks ? JSON.stringify(move.supplyChecks) : "—"}`,
    `Move updated: ${move.updatedAt.toISOString().slice(0, 10)}`,
  ].join("\n");

  return {
    profile,
    destinationAddress: move.destinationAddress ?? "",
    destination: move.destination,
    lat: move.destinationLat ?? undefined,
    lon: move.destinationLon ?? undefined,
    isAddressConfirmed: Boolean(move.destinationAddress),
    vehicles,
    vehicle: primaryVehicle,
    locale: opts.locale ?? (move.user.locale === "es" ? "es" : "en"),
    userMessage: opts.userMessage,
    inventorySummary,
    checklistSummary,
    budgetSummary,
    routeStats,
    documentsSummary,
    collaboratorsSummary,
    partnerQuotesSummary,
    recentActivitySummary,
    accountSummary,
    moveMetaSummary,
    accessRole: access.role,
    isAdminScope: false,
  };
}
