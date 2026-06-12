import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { buildMoveDataFromProfile, buildDefaultMoveData } from "@/lib/db/move-service";
import type { MoveProfile } from "@/lib/move-profile";
import type { VehicleInfo } from "@/lib/vehicles/types";

export type UserRole = "user" | "admin";

export interface AuthSessionUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  username?: string | null;
}

function normalizeIdentifier(value: string): string {
  return value.trim().toLowerCase();
}

export async function findUserByIdentifier(identifier: string) {
  const id = normalizeIdentifier(identifier);
  if (!id) return null;

  if (id.includes("@")) {
    return prisma.user.findUnique({ where: { email: id } });
  }

  return prisma.user.findFirst({
    where: {
      OR: [{ username: id }, { email: id }],
    },
  });
}

export async function authenticateUser(
  identifier: string,
  password?: string
): Promise<
  | { user: AuthSessionUser; moveId: string | null }
  | { suspended: true }
  | null
> {
  const user = await findUserByIdentifier(identifier);
  if (!user) return null;

  if (user.suspendedAt) {
    return { suspended: true };
  }

  if (!user.passwordHash || !password || !(await verifyPassword(password, user.passwordHash))) {
    return null;
  }

  const sessionUser: AuthSessionUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: (user.role as UserRole) || "user",
    username: user.username,
  };

  if (sessionUser.role === "admin") {
    return { user: sessionUser, moveId: null };
  }

  let move = await prisma.move.findFirst({
    where: { userId: user.id },
    orderBy: { updatedAt: "desc" },
  });

  if (!move) {
    move = await prisma.move.create({
      data: {
        userId: user.id,
        ...(await buildDefaultMoveData()),
      },
    });
  }

  return { user: sessionUser, moveId: move.id };
}

export async function registerUserWithPassword(
  email: string,
  name: string,
  password: string,
  role: UserRole = "user",
  username?: string | null,
  profile?: MoveProfile,
  vehicles: VehicleInfo[] = []
): Promise<AuthSessionUser> {
  const normalizedEmail = normalizeIdentifier(email);
  if (!normalizedEmail.includes("@")) {
    throw new Error("Valid email required");
  }

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) throw new Error("User already exists");

  if (username?.trim()) {
    const taken = await prisma.user.findUnique({
      where: { username: username.trim().toLowerCase() },
    });
    if (taken) throw new Error("Username already in use");
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      name: name.trim() || normalizedEmail.split("@")[0],
      username: username?.trim().toLowerCase() || null,
      passwordHash,
      role,
      moves:
        role === "admin"
          ? undefined
          : {
              create: profile
                ? await buildMoveDataFromProfile(profile, vehicles)
                : await buildDefaultMoveData(),
            },
    },
  });

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: (user.role as UserRole) || "user",
    username: user.username,
  };
}

export async function listAllUsers() {
  return prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      email: true,
      username: true,
      name: true,
      role: true,
      createdAt: true,
      _count: { select: { moves: true } },
    },
  });
}

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });
}

export async function getUserById(id: string) {
  return prisma.user.findUnique({ where: { id } });
}

export interface AdminUserUpdate {
  name?: string;
  email?: string;
  username?: string | null;
  role?: UserRole;
  password?: string;
  suspended?: boolean;
}

const userSelect = {
  id: true,
  email: true,
  username: true,
  name: true,
  role: true,
  suspendedAt: true,
  createdAt: true,
  _count: { select: { moves: true, sessions: true } },
} as const;

export async function updateUserByAdmin(
  userId: string,
  data: AdminUserUpdate,
  actingAdminId: string
) {
  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) throw new Error("User not found");

  if (data.role === "user" && target.id === actingAdminId) {
    throw new Error("Cannot remove your own admin role");
  }

  if (data.email?.trim()) {
    const email = normalizeIdentifier(data.email);
    if (!email.includes("@")) throw new Error("Valid email required");
    const conflict = await prisma.user.findFirst({
      where: { email, NOT: { id: userId } },
    });
    if (conflict) throw new Error("Email already in use");
  }

  if (data.username !== undefined && data.username?.trim()) {
    const username = data.username.trim().toLowerCase();
    const conflict = await prisma.user.findFirst({
      where: { username, NOT: { id: userId } },
    });
    if (conflict) throw new Error("Username already in use");
  }

  if (data.password !== undefined && data.password.trim() && data.password.length < 6) {
    throw new Error("Password must be at least 6 characters");
  }

  const updateData: {
    name?: string;
    email?: string;
    username?: string | null;
    role?: string;
    passwordHash?: string;
    suspendedAt?: Date | null;
  } = {};

  if (data.name !== undefined) updateData.name = data.name.trim() || target.name;
  if (data.email !== undefined) updateData.email = normalizeIdentifier(data.email);
  if (data.username !== undefined) {
    updateData.username = data.username?.trim().toLowerCase() || null;
  }
  if (data.role !== undefined) updateData.role = data.role;
  if (data.password?.trim()) {
    updateData.passwordHash = await hashPassword(data.password);
  }
  if (data.suspended !== undefined) {
    updateData.suspendedAt = data.suspended ? new Date() : null;
  }

  return prisma.user.update({
    where: { id: userId },
    data: updateData as Parameters<typeof prisma.user.update>[0]["data"],
    select: userSelect,
  });
}

export async function deleteUserByAdmin(userId: string, actingAdminId: string) {
  if (userId === actingAdminId) {
    throw new Error("Cannot delete your own account");
  }

  const target = await prisma.user.findUnique({ where: { id: userId } });
  if (!target) throw new Error("User not found");

  if (target.role === "admin") {
    const adminCount = await prisma.user.count({ where: { role: "admin" } });
    if (adminCount <= 1) {
      throw new Error("Cannot delete the only administrator");
    }
  }

  await prisma.user.delete({ where: { id: userId } });
}

/** @deprecated use registerUserWithPassword */
export async function loginOrCreateByEmail() {
  throw new Error("Email-only login disabled. Use register or login with password.");
}
