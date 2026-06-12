import { prisma } from "@/lib/prisma";

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

export async function resolveMoveAccess(userId: string): Promise<MoveAccess | null> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;

  if (user.activeMoveId) {
    const access = await accessForMoveId(userId, user.activeMoveId);
    if (access) return access;
  }

  const owned = await prisma.move.findFirst({
    where: { userId },
    orderBy: { updatedAt: "desc" },
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
    where: { userId, acceptedAt: { not: null } },
    orderBy: { acceptedAt: "desc" },
    include: { move: { include: { user: { select: { name: true } } } } },
  });
  if (collab) {
    return {
      moveId: collab.moveId,
      role: (collab.role === "viewer" ? "viewer" : "editor") as MoveAccessRole,
      ownerUserId: collab.move.userId,
      ownerName: collab.move.user.name,
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
    return {
      moveId: collab.moveId,
      role: (collab.role === "viewer" ? "viewer" : "editor") as MoveAccessRole,
      ownerUserId: collab.move.userId,
      ownerName: collab.move.user.name,
    };
  }

  return null;
}

export async function setActiveMove(userId: string, moveId: string) {
  const access = await accessForMoveId(userId, moveId);
  if (!access) throw new Error("No access to move");
  await prisma.user.update({
    where: { id: userId },
    data: { activeMoveId: moveId },
  });
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
