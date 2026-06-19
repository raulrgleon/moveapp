import { PARTNER_DIRECTORY, type PartnerDirectoryEntry } from "@/lib/partner/directory";
import { prisma } from "@/lib/prisma";

export const PARTNER_SPECIALTY_OPTIONS = [
  "local",
  "long_distance",
  "packing",
  "labor",
  "loading",
  "container",
  "storage",
  "full_service",
] as const;

export type PartnerSpecialty = (typeof PARTNER_SPECIALTY_OPTIONS)[number];

export interface MovingPartnerRecord {
  id: string;
  name: string;
  regions: string[];
  usdot: string | null;
  rating: number | null;
  yearsInBusiness: number | null;
  specialties: string[];
  website: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  notes: string | null;
  active: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

function rowToEntry(row: {
  id: string;
  name: string;
  regions: string[];
  usdot: string | null;
  rating: number | null;
  yearsInBusiness: number | null;
  specialties: string[];
  website: string | null;
}): PartnerDirectoryEntry {
  return {
    id: row.id,
    name: row.name,
    regions: row.regions,
    usdot: row.usdot ?? undefined,
    rating: row.rating ?? undefined,
    yearsInBusiness: row.yearsInBusiness ?? undefined,
    specialties: row.specialties,
    website: row.website ?? undefined,
  };
}

function rowToRecord(row: {
  id: string;
  name: string;
  regions: string[];
  usdot: string | null;
  rating: number | null;
  yearsInBusiness: number | null;
  specialties: string[];
  website: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  notes: string | null;
  active: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}): MovingPartnerRecord {
  return {
    id: row.id,
    name: row.name,
    regions: row.regions,
    usdot: row.usdot,
    rating: row.rating,
    yearsInBusiness: row.yearsInBusiness,
    specialties: row.specialties,
    website: row.website,
    contactEmail: row.contactEmail,
    contactPhone: row.contactPhone,
    notes: row.notes,
    active: row.active,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function ensureDefaultMovingPartners(): Promise<void> {
  const count = await prisma.movingPartner.count();
  if (count > 0) return;

  await prisma.movingPartner.createMany({
    data: PARTNER_DIRECTORY.map((entry, index) => ({
      name: entry.name,
      regions: entry.regions,
      usdot: entry.usdot ?? null,
      rating: entry.rating ?? null,
      yearsInBusiness: entry.yearsInBusiness ?? null,
      specialties: entry.specialties,
      website: entry.website ?? null,
      active: true,
      sortOrder: index,
    })),
  });
}

export async function listActivePartnersForRoute(
  origin: string,
  destination: string
): Promise<PartnerDirectoryEntry[]> {
  await ensureDefaultMovingPartners();

  const rows = await prisma.movingPartner.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });

  const entries = rows.map(rowToEntry);
  const isLongDistance =
    origin.split(",")[1]?.trim().toLowerCase() !==
    destination.split(",")[1]?.trim().toLowerCase();

  const filtered = entries.filter((entry) => {
    if (isLongDistance) {
      return (
        entry.specialties.includes("long_distance") ||
        entry.regions.some((r) => /nationwide|cross-state|us/i.test(r))
      );
    }
    return (
      entry.specialties.includes("local") ||
      entry.regions.some((r) => /nationwide|us/i.test(r))
    );
  });

  return (filtered.length ? filtered : entries).slice(0, 6);
}

export async function listAllMovingPartnersAdmin(): Promise<MovingPartnerRecord[]> {
  await ensureDefaultMovingPartners();
  const rows = await prisma.movingPartner.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  return rows.map(rowToRecord);
}

export async function createMovingPartner(input: {
  name: string;
  regions?: string[];
  usdot?: string | null;
  rating?: number | null;
  yearsInBusiness?: number | null;
  specialties?: string[];
  website?: string | null;
  contactEmail?: string | null;
  contactPhone?: string | null;
  notes?: string | null;
  active?: boolean;
  sortOrder?: number;
}): Promise<MovingPartnerRecord> {
  const row = await prisma.movingPartner.create({
    data: {
      name: input.name.trim(),
      regions: input.regions ?? [],
      usdot: input.usdot?.trim() || null,
      rating: input.rating ?? null,
      yearsInBusiness: input.yearsInBusiness ?? null,
      specialties: input.specialties ?? [],
      website: input.website?.trim() || null,
      contactEmail: input.contactEmail?.trim() || null,
      contactPhone: input.contactPhone?.trim() || null,
      notes: input.notes?.trim() || null,
      active: input.active ?? true,
      sortOrder: input.sortOrder ?? 0,
    },
  });
  return rowToRecord(row);
}

export async function updateMovingPartner(
  id: string,
  input: Partial<{
    name: string;
    regions: string[];
    usdot: string | null;
    rating: number | null;
    yearsInBusiness: number | null;
    specialties: string[];
    website: string | null;
    contactEmail: string | null;
    contactPhone: string | null;
    notes: string | null;
    active: boolean;
    sortOrder: number;
  }>
): Promise<MovingPartnerRecord | null> {
  try {
    const row = await prisma.movingPartner.update({
      where: { id },
      data: {
        ...(input.name !== undefined && { name: input.name.trim() }),
        ...(input.regions !== undefined && { regions: input.regions }),
        ...(input.usdot !== undefined && { usdot: input.usdot?.trim() || null }),
        ...(input.rating !== undefined && { rating: input.rating }),
        ...(input.yearsInBusiness !== undefined && { yearsInBusiness: input.yearsInBusiness }),
        ...(input.specialties !== undefined && { specialties: input.specialties }),
        ...(input.website !== undefined && { website: input.website?.trim() || null }),
        ...(input.contactEmail !== undefined && {
          contactEmail: input.contactEmail?.trim() || null,
        }),
        ...(input.contactPhone !== undefined && {
          contactPhone: input.contactPhone?.trim() || null,
        }),
        ...(input.notes !== undefined && { notes: input.notes?.trim() || null }),
        ...(input.active !== undefined && { active: input.active }),
        ...(input.sortOrder !== undefined && { sortOrder: input.sortOrder }),
      },
    });
    return rowToRecord(row);
  } catch {
    return null;
  }
}

export async function deleteMovingPartner(id: string): Promise<boolean> {
  try {
    await prisma.movingPartner.delete({ where: { id } });
    return true;
  } catch {
    return false;
  }
}
