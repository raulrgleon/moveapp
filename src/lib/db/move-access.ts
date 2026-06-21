import { prisma } from "@/lib/prisma";
import { buildDefaultMoveData } from "@/lib/db/move-service";

export type MoveAccessRole = "owner" | "editor" | "viewer";

export interface MoveAccess {
  moveId: string;
  role: MoveAccessRole;
  ownerUserId: string;
  ownerName: string;
}

const moveInclude = {
  vehicles: true,
  inventoryBoxes: { orderBy: { boxNumber: "asc" as const } },
  checklistTasks: { orderBy: { dueDate: "asc" as const } },
  documents: { orderBy: { uploadedAt: "desc" as const } },
  budgetItems: { orderBy: { sortOrder: "asc" as const } },
  user: { select: { id: true, name: true, email: true } },
};

export type MoveWithRelations = NonNullable<
  Awaited<ReturnType<typeof loadMoveWithRelations>>
>;

async function loadMoveWithRelations(moveId: string) {
  return prisma.move.findUnique({
    where: { id: moveId },
    include: moveInclude,
  });
}

/** Empty default move created at signup before onboarding completes. */
export function isShellMove(move: {
  origin?: string | null;
  destination?: string | null;
  destinationAddress?: string | null;
}): boolean {
  const hasOrigin = Boolean(move.origin?.trim());
  const hasDestination = Boolean(
    move.destination?.trim() || move.destinationAddress?.trim()
  );
  return !hasOrigin && !hasDestination;
}

async function latestCollaboration(userId: string) {
  return prisma.moveCollaborator.findFirst({
    where: { userId, acceptedAt: { not: null } },
    orderBy: { acceptedAt: "desc" },
    include: { move: { include: { user: { select: { name: true } } } } },
  });
}

async function latestOwnedMove(userId: string) {
  return prisma.move.findFirst({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: { user: { select: { name: true } } },
  });
}

function collabToAccess(collab: NonNullable<Awaited<ReturnType<typeof latestCollaboration>>>): MoveAccess {
  return {
    moveId: collab.moveId,
    role: (collab.role === "viewer" ? "viewer" : "editor") as MoveAccessRole,
    ownerUserId: collab.move.userId,
    ownerName: collab.move.user.name,
  };
}

async function persistActiveMove(userId: string, moveId: string) {
  await prisma.user.update({
    where: { id: userId },
    data: { activeMoveId: moveId },
  });
}

/**
 * Resolves the move id for login/session bootstrap.
 * Collaborators with only a shell owned move use the shared move instead.
 */
export async function resolveSessionMoveId(userId: string): Promise<string | null> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;

  if (user.activeMoveId) {
    const access = await accessForMoveId(userId, user.activeMoveId);
    if (access) return access.moveId;
  }

  const owned = await latestOwnedMove(userId);
  const collab = await latestCollaboration(userId);

  if (collab && (!owned || isShellMove(owned))) {
    await persistActiveMove(userId, collab.moveId);
    return collab.moveId;
  }

  if (owned) return owned.id;

  if (collab) {
    await persistActiveMove(userId, collab.moveId);
    return collab.moveId;
  }

  const newMove = await prisma.move.create({
    data: {
      userId,
      ...(await buildDefaultMoveData()),
    },
  });
  await persistActiveMove(userId, newMove.id);
  return newMove.id;
}

export async function resolveMoveAccess(userId: string): Promise<MoveAccess | null> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;

  if (user.activeMoveId) {
    const access = await accessForMoveId(userId, user.activeMoveId);
    if (access) return access;
  }

  const owned = await latestOwnedMove(userId);
  const collab = await latestCollaboration(userId);

  if (owned && !(collab && isShellMove(owned))) {
    return {
      moveId: owned.id,
      role: "owner",
      ownerUserId: userId,
      ownerName: owned.user.name,
    };
  }

  if (collab) {
    await persistActiveMove(userId, collab.moveId);
    return collabToAccess(collab);
  }

  if (owned) {
    return {
      moveId: owned.id,
      role: "owner",
      ownerUserId: userId,
      ownerName: owned.user.name,
    };
  }

  return null;
}

async function accessForMoveId(userId: string, moveId: string): Promise<MoveAccess | null> {
  const owned = await prisma.move.findFirst({
    where: { id: moveId, userId },
    include: { user: { select: { name: true } } },
  });
  if (owned) {
    return {
      moveId: owned.id,
      role: "owner",
      ownerUserId: userId,
      ownerName: owned.user.name,
    };
  }

  const collab = await prisma.moveCollaborator.findFirst({
    where: { moveId, userId, acceptedAt: { not: null } },
    include: { move: { include: { user: { select: { name: true } } } } },
  });
  if (collab) {
    return collabToAccess(collab);
  }

  return null;
}

export async function setActiveMove(userId: string, moveId: string) {
  const access = await accessForMoveId(userId, moveId);
  if (!access) throw new Error("No access to move");
  await persistActiveMove(userId, moveId);
  return access;
}

export async function getMoveForUser(userId: string) {
  const access = await resolveMoveAccess(userId);
  if (!access) return null;
  const move = await loadMoveWithRelations(access.moveId);
  if (!move) return null;
  return { access, move };
}

export function canEditMoveProfile(role: MoveAccessRole): boolean {
  return role === "owner";
}

export function canEditMoveData(role: MoveAccessRole): boolean {
  return role === "owner" || role === "editor";
}

export function canManageCollaborators(role: MoveAccessRole): boolean {
  return role === "owner";
}
