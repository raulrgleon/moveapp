import { prisma } from "@/lib/prisma";
import { logMoveActivity } from "@/lib/db/activity";
import type { Locale } from "@/lib/i18n";
import {
  canEditMoveData,
  getMoveForUser,
  resolveMoveAccess,
} from "@/lib/db/move-access";
import { DEFAULT_PROFILE, type MoveProfile } from "@/lib/move-profile";
import {
  generateChecklistFromProfile,
  generateStarterDocuments,
} from "@/lib/move/generate-checklist";
import { estimateBudget } from "@/lib/budget/estimator";
import { resolveRouteDistanceMiles } from "@/lib/geo/route-service";
import type { VehicleInfo } from "@/lib/vehicles/types";
import type { InventoryBox } from "@/lib/inventory/types";
import type { ChecklistTask, DocumentItem } from "@/lib/types";

function defaultMoveDate() {
  return new Date(DEFAULT_PROFILE.moveDate);
}

export async function loginOrCreateUser(email: string, name: string, password: string) {
  const normalizedEmail = email.trim().toLowerCase();
  let user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    include: {
      moves: {
        orderBy: { updatedAt: "desc" },
        take: 1,
      },
    },
  });

  if (!user) {
    await prisma.user.create({
      data: {
        email: normalizedEmail,
        name: name.trim() || normalizedEmail.split("@")[0],
        moves: {
          create: await buildDefaultMoveData(),
        },
      },
    });
  } else if (name.trim()) {
    await prisma.user.update({
      where: { id: user.id },
      data: { name: name.trim() },
    });
  }

  user = await prisma.user.findUniqueOrThrow({
    where: { email: normalizedEmail },
    include: {
      moves: { orderBy: { updatedAt: "desc" }, take: 1 },
    },
  });

  let move = user.moves[0];
  if (!move) {
    move = await prisma.move.create({
      data: {
        userId: user.id,
        ...(await buildDefaultMoveData()),
      },
    });
  }

  return { user, moveId: move.id };
}

function userLocale(locale: string | null | undefined): Locale {
  return locale === "es" ? "es" : "en";
}

async function getUserLocale(userId: string): Promise<Locale> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { locale: true },
  });
  return userLocale(user?.locale);
}

export async function buildMoveDataFromProfile(
  profile: MoveProfile,
  vehicles: VehicleInfo[] = [],
  locale: Locale = "en"
) {
  const checklist = generateChecklistFromProfile(profile, locale);
  const documents = generateStarterDocuments(profile, locale);
  const budget = estimateBudget(profile);

  return {
    origin: profile.origin,
    destination: profile.destination,
    moveDate: new Date(profile.moveDate),
    household: profile.household,
    petDetails: profile.petDetails || null,
    pets: profile.pets,
    budget: profile.budget,
    rentalPreference: profile.rentalPreference,
    needsHousingHelp: profile.needsHousingHelp,
    needsVehicleTransport: profile.needsVehicleTransport,
    originLat: profile.originLat ?? null,
    originLon: profile.originLon ?? null,
    destinationLat: profile.destinationLat ?? null,
    destinationLon: profile.destinationLon ?? null,
    vehicles: {
      create: vehicles
        .filter((v) => v.make?.trim() && v.model?.trim())
        .map((v) => ({
          year: v.year,
          makeId: v.makeId,
          make: v.make,
          modelId: v.modelId,
          model: v.model,
          trim: v.trim ?? null,
          displayLabel: v.displayLabel,
        })),
    },
    checklistTasks: {
      create: checklist.map((t) => ({
        title: t.title,
        category: t.category,
        status: t.status,
        dueDate: t.dueDate ? new Date(t.dueDate) : null,
        priority: t.priority,
      })),
    },
    documents: {
      create: documents.map((d) => ({
        name: d.name,
        category: d.category,
        status: d.status,
      })),
    },
    budgetItems: {
      create: budget.items.map((item) => ({
        category: item.category,
        estimated: item.estimated,
        cheapestOption: item.cheapestOption ?? null,
        sortOrder: item.sortOrder,
      })),
    },
  };
}

export async function buildDefaultMoveData() {
  return buildMoveDataFromProfile(DEFAULT_PROFILE, []);
}

export async function syncBudgetEstimate(moveId: string, profile: MoveProfile) {
  const distanceMiles = await resolveRouteDistanceMiles(profile);
  const estimate = estimateBudget(profile, distanceMiles);
  await prisma.budgetItem.deleteMany({ where: { moveId } });
  if (estimate.items.length > 0) {
    await prisma.budgetItem.createMany({
      data: estimate.items.map((item) => ({
        moveId,
        category: item.category,
        estimated: item.estimated,
        cheapestOption: item.cheapestOption ?? null,
        sortOrder: item.sortOrder,
      })),
    });
  }
  return estimate;
}

function mergeProfileForSync(
  user: { name: string; email: string },
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
  },
  patch?: Partial<MoveProfile>
): MoveProfile {
  return {
    name: patch?.name ?? user.name,
    email: user.email,
    origin: patch?.origin ?? move.origin,
    destination: patch?.destination ?? move.destination,
    moveDate: patch?.moveDate ?? move.moveDate.toISOString().slice(0, 10),
    household: patch?.household ?? move.household,
    pets: patch?.pets ?? move.pets,
    petDetails: patch?.petDetails ?? move.petDetails ?? "",
    budget: patch?.budget ?? move.budget,
    rentalPreference: patch?.rentalPreference ?? move.rentalPreference,
    needsHousingHelp: patch?.needsHousingHelp ?? move.needsHousingHelp,
    needsVehicleTransport: patch?.needsVehicleTransport ?? move.needsVehicleTransport,
    originLat: patch?.originLat ?? move.originLat ?? undefined,
    originLon: patch?.originLon ?? move.originLon ?? undefined,
    destinationLat: patch?.destinationLat ?? move.destinationLat ?? undefined,
    destinationLon: patch?.destinationLon ?? move.destinationLon ?? undefined,
  };
}

function profileChangeRequiresRecalc(p: Partial<MoveProfile>): boolean {
  return (
    p.origin !== undefined ||
    p.destination !== undefined ||
    p.moveDate !== undefined ||
    p.household !== undefined ||
    p.pets !== undefined ||
    p.petDetails !== undefined ||
    p.budget !== undefined ||
    p.rentalPreference !== undefined ||
    p.needsHousingHelp !== undefined ||
    p.needsVehicleTransport !== undefined ||
    p.originLat !== undefined ||
    p.originLon !== undefined ||
    p.destinationLat !== undefined ||
    p.destinationLon !== undefined
  );
}

function profileChangeRequiresChecklistSync(p: Partial<MoveProfile>): boolean {
  return (
    p.origin !== undefined ||
    p.destination !== undefined ||
    p.moveDate !== undefined ||
    p.household !== undefined ||
    p.pets !== undefined ||
    p.needsHousingHelp !== undefined ||
    p.needsVehicleTransport !== undefined
  );
}

export async function syncChecklistFromProfile(
  moveId: string,
  profile: MoveProfile,
  locale: Locale = "en"
) {
  const existing = await prisma.checklistTask.findMany({ where: { moveId } });
  const completedByTitle = new Map(
    existing.filter((t) => t.status === "completed").map((t) => [t.title, t.status])
  );
  const notesByTitle = new Map(
    existing.filter((t) => t.notes).map((t) => [t.title, { notes: t.notes, assigneeEmail: t.assigneeEmail }])
  );
  const fresh = generateChecklistFromProfile(profile, locale);

  await prisma.checklistTask.deleteMany({ where: { moveId } });
  if (fresh.length > 0) {
    await prisma.checklistTask.createMany({
      data: fresh.map((t) => {
        const extra = notesByTitle.get(t.title);
        return {
          moveId,
          title: t.title,
          category: t.category,
          status: completedByTitle.has(t.title) ? "completed" : t.status,
          dueDate: t.dueDate ? new Date(t.dueDate) : null,
          priority: t.priority,
          notes: extra?.notes ?? null,
          assigneeEmail: extra?.assigneeEmail ?? null,
        };
      }),
    });
  }
}

export async function getUserData(email: string) {
  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });
  if (!user) return null;
  return getUserDataByUserId(user.id);
}

export async function getUserDataByUserId(userId: string) {
  const result = await getMoveForUser(userId);
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;

  if (!result) {
    return {
      user: { id: user.id, email: user.email, name: user.name },
      moveId: null,
      profile: null,
      destinationAddress: "",
      destinationLat: undefined,
      destinationLon: undefined,
      isAddressConfirmed: false,
      vehicles: [],
      inventory: [],
      checklist: [],
      documents: [],
      moveRole: "owner" as const,
      ownerName: user.name,
      canEdit: true,
      canEditProfile: true,
      stats: { checklist: 0, inventory: 0, documents: 0, vehicles: 0 },
    };
  }

  const { access, move } = result;
  const profileName = access.role === "owner" ? user.name : move.user.name;

  return {
    user: { id: user.id, email: user.email, name: user.name },
    moveId: move.id,
    profile: moveToProfile(profileName, move.user.email, move),
    destinationAddress: move.destinationAddress ?? "",
    destinationLat: move.destinationLat ?? undefined,
    destinationLon: move.destinationLon ?? undefined,
    isAddressConfirmed: Boolean(move.destinationAddress),
    vehicles: move.vehicles.map(dbToVehicle),
    truckChoice: move.truckChoice ?? null,
    vehicleTransportChoice: move.vehicleTransportChoice ?? null,
    inventory: move.inventoryBoxes.map(dbToInventory),
    checklist: move.checklistTasks.map(dbToChecklist),
    documents: move.documents.map(dbToDocument),
    moveRole: access.role,
    ownerName: access.ownerName,
    canEdit: canEditMoveData(access.role),
    canEditProfile: access.role === "owner",
    stats: {
      checklist: move.checklistTasks.length,
      inventory: move.inventoryBoxes.length,
      documents: move.documents.length,
      vehicles: move.vehicles.length,
    },
  };
}

export async function ensureMoveForUserId(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { moves: { take: 1, orderBy: { updatedAt: "desc" } } },
  });
  if (!user) throw new Error("User not found");
  if (user.moves[0]) return user.moves[0].id;

  const move = await prisma.move.create({
    data: {
      userId: user.id,
      ...(await buildDefaultMoveData()),
    },
  });
  return move.id;
}

function moveToProfile(name: string, email: string, move: {
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
}): MoveProfile {
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
  makeId: number | null;
  make: string;
  modelId: number | null;
  model: string;
  trim: string | null;
  displayLabel: string;
  needsTransport?: boolean;
}): VehicleInfo {
  return {
    id: v.id,
    year: v.year,
    makeId: v.makeId ?? 0,
    make: v.make,
    modelId: v.modelId ?? 0,
    model: v.model,
    trim: v.trim ?? undefined,
    displayLabel: v.displayLabel,
    needsTransport: v.needsTransport ?? false,
  };
}

function dbToInventory(b: {
  id: string;
  boxNumber: number;
  room: string;
  destinationRoom?: string | null;
  contents: string;
  photoUrl: string | null;
  fragile: boolean;
  essentials?: boolean;
  sizeEstimate?: string | null;
  weightLbs?: number | null;
  assigneeEmail?: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}): InventoryBox {
  return {
    id: b.id,
    boxNumber: b.boxNumber,
    room: b.room as InventoryBox["room"],
    destinationRoom: (b.destinationRoom as InventoryBox["destinationRoom"]) ?? undefined,
    contents: b.contents,
    photoUrl: b.photoUrl ?? undefined,
    fragile: b.fragile,
    essentials: b.essentials ?? false,
    sizeEstimate: (b.sizeEstimate as InventoryBox["sizeEstimate"]) ?? undefined,
    weightLbs: b.weightLbs ?? undefined,
    assigneeEmail: b.assigneeEmail ?? undefined,
    status: b.status as InventoryBox["status"],
    createdAt: b.createdAt.toISOString(),
    updatedAt: b.updatedAt.toISOString(),
  };
}

function dbToChecklist(t: {
  id: string;
  title: string;
  category: string;
  status: string;
  dueDate: Date | null;
  priority: string;
  notes?: string | null;
  assigneeEmail?: string | null;
}): ChecklistTask {
  return {
    id: t.id,
    title: t.title,
    category: t.category,
    status: t.status as ChecklistTask["status"],
    dueDate: t.dueDate ? t.dueDate.toISOString().slice(0, 10) : "",
    priority: t.priority as ChecklistTask["priority"],
    notes: t.notes ?? undefined,
    assigneeEmail: t.assigneeEmail ?? undefined,
  };
}

function dbToDocument(d: {
  id: string;
  name: string;
  category: string;
  status: string;
  fileName: string | null;
  storageKey: string | null;
  mimeType: string | null;
  sizeBytes: number | null;
  uploadedAt: Date | null;
  expiresAt?: Date | null;
}): DocumentItem & { fileName?: string; hasFile?: boolean; sizeBytes?: number } {
  return {
    id: d.id,
    name: d.name,
    category: d.category,
    status: d.status as DocumentItem["status"],
    uploadedAt: d.uploadedAt ? d.uploadedAt.toISOString().slice(0, 10) : undefined,
    expiresAt: d.expiresAt ? d.expiresAt.toISOString().slice(0, 10) : undefined,
    mimeType: d.mimeType ?? undefined,
    fileName: d.fileName ?? undefined,
    hasFile: Boolean(d.storageKey),
    sizeBytes: d.sizeBytes ?? undefined,
  };
}

export async function updateMoveForUser(
  email: string,
  data: {
    profile?: Partial<MoveProfile>;
    destinationAddress?: string | null;
    destinationLat?: number;
    destinationLon?: number;
    destinationLabel?: string;
    vehicles?: VehicleInfo[];
    truckChoice?: string | null;
    vehicleTransportChoice?: string | null;
  }
) {
  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });
  if (!user) throw new Error("User not found");
  await updateMoveForUserId(user.id, data);
}

export async function updateMoveForUserId(
  userId: string,
  data: {
    profile?: Partial<MoveProfile>;
    destinationAddress?: string | null;
    destinationLat?: number;
    destinationLon?: number;
    destinationLabel?: string;
    vehicles?: VehicleInfo[];
    truckChoice?: string | null;
    vehicleTransportChoice?: string | null;
  },
  createIfMissing = true
) {
  const access = await resolveMoveAccess(userId);
  if (!access || access.role !== "owner") {
    throw new Error("Only the move owner can update profile settings");
  }

  const moveId = createIfMissing
    ? access.moveId || (await ensureMoveForUserId(userId))
    : access.moveId;

  const p = data.profile;

  await prisma.move.update({
    where: { id: moveId },
    data: {
      ...(p?.origin !== undefined && { origin: p.origin }),
      ...(p?.destination !== undefined && { destination: p.destination }),
      ...(p?.moveDate !== undefined && { moveDate: new Date(p.moveDate) }),
      ...(p?.household !== undefined && { household: p.household }),
      ...(p?.pets !== undefined && { pets: p.pets }),
      ...(p?.petDetails !== undefined && { petDetails: p.petDetails }),
      ...(p?.budget !== undefined && { budget: p.budget }),
      ...(p?.rentalPreference !== undefined && { rentalPreference: p.rentalPreference }),
      ...(p?.needsHousingHelp !== undefined && { needsHousingHelp: p.needsHousingHelp }),
      ...(p?.needsVehicleTransport !== undefined && {
        needsVehicleTransport: p.needsVehicleTransport,
      }),
      ...(p?.originLat !== undefined && { originLat: p.originLat }),
      ...(p?.originLon !== undefined && { originLon: p.originLon }),
      ...(p?.destinationLat !== undefined && { destinationLat: p.destinationLat }),
      ...(p?.destinationLon !== undefined && { destinationLon: p.destinationLon }),
      ...(data.destinationAddress !== undefined && {
        destinationAddress: data.destinationAddress,
      }),
      ...(data.destinationLat !== undefined && { destinationLat: data.destinationLat }),
      ...(data.destinationLon !== undefined && { destinationLon: data.destinationLon }),
      ...(data.destinationLabel !== undefined && { destination: data.destinationLabel }),
      ...(data.truckChoice !== undefined && { truckChoice: data.truckChoice }),
      ...(data.vehicleTransportChoice !== undefined && {
        vehicleTransportChoice: data.vehicleTransportChoice,
      }),
    },
  });

  if (data.truckChoice !== undefined) {
    await logMoveActivity(moveId, userId, "truck_choice_saved", {
      choice: data.truckChoice ?? "",
    });
  }
  if (data.vehicleTransportChoice !== undefined) {
    await logMoveActivity(moveId, userId, "vehicle_transport_saved", {
      choice: data.vehicleTransportChoice ?? "",
    });
  }
  if (data.destinationAddress !== undefined && data.destinationAddress) {
    await logMoveActivity(moveId, userId, "address_confirmed");
  }
  if (p && profileChangeRequiresRecalc(p)) {
    await logMoveActivity(moveId, userId, "profile_updated");
  }

  if (p?.name) {
    await prisma.user.update({ where: { id: userId }, data: { name: p.name } });
  }

  if (data.vehicles) {
    const complete = data.vehicles.filter((v) => v.make?.trim() && v.model?.trim());
    await prisma.vehicle.deleteMany({ where: { moveId } });
    if (complete.length > 0) {
      await prisma.vehicle.createMany({
        data: complete.map((v) => ({
          moveId,
          year: v.year,
          makeId: v.makeId,
          make: v.make,
          modelId: v.modelId,
          model: v.model,
          trim: v.trim ?? null,
          displayLabel: v.displayLabel,
          needsTransport: v.needsTransport ?? false,
        })),
      });
    }
  }

  if (p && profileChangeRequiresRecalc(p)) {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const move = await prisma.move.findUniqueOrThrow({ where: { id: moveId } });
    const merged = mergeProfileForSync(user, move, {
      ...p,
      ...(data.destinationLat !== undefined && { destinationLat: data.destinationLat }),
      ...(data.destinationLon !== undefined && { destinationLon: data.destinationLon }),
    });
    await syncBudgetEstimate(moveId, merged);
    if (profileChangeRequiresChecklistSync(p)) {
      const locale = await getUserLocale(userId);
      await syncChecklistFromProfile(moveId, merged, locale);
    }
  } else if (
    data.destinationLat !== undefined ||
    data.destinationLon !== undefined
  ) {
    const user = await prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const move = await prisma.move.findUniqueOrThrow({ where: { id: moveId } });
    const merged = mergeProfileForSync(user, move, {
      destinationLat: data.destinationLat,
      destinationLon: data.destinationLon,
    });
    await syncBudgetEstimate(moveId, merged);
  }
}

async function getMoveIdForUser(userId: string, requireEdit = true) {
  const access = await resolveMoveAccess(userId);
  if (!access) throw new Error("Move not found");
  if (requireEdit && !canEditMoveData(access.role)) {
    throw new Error("Read-only access");
  }
  return access.moveId;
}

export async function replaceInventory(userId: string, boxes: InventoryBox[]) {
  const moveId = await getMoveIdForUser(userId);
  await prisma.$transaction([
    prisma.inventoryBox.deleteMany({ where: { moveId } }),
    ...boxes.map((b) =>
      prisma.inventoryBox.create({
        data: {
          id: b.id.startsWith("box-") ? undefined : b.id,
          moveId,
          boxNumber: b.boxNumber,
          room: b.room,
          destinationRoom: b.destinationRoom ?? null,
          contents: b.contents,
          photoUrl: b.photoUrl ?? null,
          fragile: b.fragile,
          essentials: b.essentials ?? false,
          sizeEstimate: b.sizeEstimate ?? null,
          weightLbs: b.weightLbs ?? null,
          assigneeEmail: b.assigneeEmail ?? null,
          status: b.status,
          createdAt: new Date(b.createdAt),
          updatedAt: new Date(b.updatedAt),
        },
      })
    ),
  ]);
}

export async function replaceChecklist(userId: string, tasks: ChecklistTask[]) {
  const moveId = await getMoveIdForUser(userId);
  await prisma.checklistTask.deleteMany({ where: { moveId } });
  if (tasks.length > 0) {
    await prisma.checklistTask.createMany({
      data: tasks.map((t) => ({
        id: t.id,
        moveId,
        title: t.title,
        category: t.category,
        status: t.status,
        dueDate: t.dueDate ? new Date(t.dueDate) : null,
        priority: t.priority,
        notes: t.notes ?? null,
        assigneeEmail: t.assigneeEmail ?? null,
      })),
    });
  }
}

export async function addChecklistTask(
  userId: string,
  task: Omit<ChecklistTask, "id"> & { id?: string }
) {
  const moveId = await getMoveIdForUser(userId);
  return prisma.checklistTask.create({
    data: {
      id: task.id,
      moveId,
      title: task.title,
      category: task.category,
      status: task.status ?? "pending",
      dueDate: task.dueDate ? new Date(task.dueDate) : null,
      priority: task.priority ?? "medium",
      notes: task.notes ?? null,
      assigneeEmail: task.assigneeEmail ?? null,
    },
  });
}

export async function deleteChecklistTask(userId: string, taskId: string) {
  const moveId = await getMoveIdForUser(userId);
  const deleted = await prisma.checklistTask.deleteMany({
    where: { id: taskId, moveId },
  });
  if (deleted.count === 0) throw new Error("Task not found");
}

export async function patchChecklistTask(
  userId: string,
  taskId: string,
  patch: Partial<Pick<ChecklistTask, "status" | "notes" | "assigneeEmail" | "title" | "category" | "dueDate" | "priority">>
) {
  const moveId = await getMoveIdForUser(userId);
  const existing = await prisma.checklistTask.findFirst({
    where: { id: taskId, moveId },
  });
  if (!existing) throw new Error("Task not found");

  const updated = await prisma.checklistTask.update({
    where: { id: taskId },
    data: {
      ...(patch.status !== undefined && { status: patch.status }),
      ...(patch.notes !== undefined && { notes: patch.notes || null }),
      ...(patch.assigneeEmail !== undefined && { assigneeEmail: patch.assigneeEmail || null }),
      ...(patch.title !== undefined && { title: patch.title }),
      ...(patch.category !== undefined && { category: patch.category }),
      ...(patch.dueDate !== undefined && {
        dueDate: patch.dueDate ? new Date(patch.dueDate) : null,
      }),
      ...(patch.priority !== undefined && { priority: patch.priority }),
    },
  });

  if (patch.status === "completed" && existing.status !== "completed") {
    await logMoveActivity(moveId, userId, "checklist_complete", {
      taskId: updated.id,
      title: updated.title,
      category: updated.category,
    });
  }

  return updated;
}

export async function listUserMoves(userId: string) {
  const owned = await prisma.move.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      origin: true,
      destination: true,
      moveDate: true,
      updatedAt: true,
    },
  });

  const collabs = await prisma.moveCollaborator.findMany({
    where: { userId, acceptedAt: { not: null } },
    orderBy: { acceptedAt: "desc" },
    include: {
      move: {
        select: {
          id: true,
          origin: true,
          destination: true,
          moveDate: true,
          updatedAt: true,
          user: { select: { name: true } },
        },
      },
    },
  });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { activeMoveId: true },
  });

  return {
    activeMoveId: user?.activeMoveId ?? null,
    moves: [
      ...owned.map((m) => ({
        id: m.id,
        origin: m.origin,
        destination: m.destination,
        moveDate: m.moveDate.toISOString().slice(0, 10),
        role: "owner" as const,
        ownerName: null as string | null,
        isActive: user?.activeMoveId === m.id,
      })),
      ...collabs.map((c) => ({
        id: c.move.id,
        origin: c.move.origin,
        destination: c.move.destination,
        moveDate: c.move.moveDate.toISOString().slice(0, 10),
        role: (c.role === "viewer" ? "viewer" : "editor") as "editor" | "viewer",
        ownerName: c.move.user.name,
        isActive: user?.activeMoveId === c.move.id,
      })),
    ],
  };
}

export async function replaceDocuments(
  userId: string,
  docs: (DocumentItem & { fileName?: string; storageKey?: string; mimeType?: string; sizeBytes?: number })[]
) {
  const moveId = await getMoveIdForUser(userId);
  await prisma.$transaction([
    prisma.document.deleteMany({ where: { moveId } }),
    ...docs.map((d) =>
      prisma.document.create({
        data: {
          id: d.id.startsWith("doc-") ? undefined : d.id,
          moveId,
          name: d.name,
          category: d.category,
          status: d.status,
          fileName: d.fileName ?? null,
          storageKey: d.storageKey ?? null,
          mimeType: d.mimeType ?? null,
          sizeBytes: d.sizeBytes ?? null,
          uploadedAt: d.uploadedAt ? new Date(d.uploadedAt) : null,
        },
      })
    ),
  ]);
}

export async function getDocumentForUser(userId: string, documentId: string) {
  const access = await resolveMoveAccess(userId);
  if (!access) return null;
  const doc = await prisma.document.findFirst({
    where: { id: documentId, moveId: access.moveId },
  });
  return doc ? { doc, access } : null;
}

export async function deleteDocumentForUser(userId: string, documentId: string) {
  const moveId = await getMoveIdForUser(userId);
  const doc = await prisma.document.findFirst({
    where: { id: documentId, moveId },
  });
  if (!doc) throw new Error("Document not found");
  await prisma.document.delete({ where: { id: documentId } });
  return doc;
}

export async function contractUtilityProvider(
  userId: string,
  providerName: string,
  category: string
) {
  const moveId = await getMoveIdForUser(userId);
  const pending = await prisma.checklistTask.findMany({
    where: { moveId, category: "Utilities", status: { not: "completed" } },
    orderBy: { dueDate: "asc" },
  });

  const cat = category.toLowerCase();
  const providerToken = providerName.split(/\s+/)[0]?.toLowerCase() ?? "";
  const match =
    pending.find(
      (t) =>
        t.title.toLowerCase().includes(cat) ||
        (providerToken.length > 2 && t.title.toLowerCase().includes(providerToken))
    ) ?? pending[0];

  let taskId: string;
  if (match) {
    const updated = await patchChecklistTask(userId, match.id, { status: "completed" });
    taskId = updated.id;
  } else {
    const created = await addChecklistTask(userId, {
      title: `Contracted ${providerName.trim()} (${category})`,
      category: "Utilities",
      status: "completed",
      dueDate: "",
      priority: "medium",
    });
    taskId = created.id;
  }

  await logMoveActivity(moveId, userId, "utility_contracted", {
    providerName,
    category,
    taskId,
  });

  return { taskId };
}

