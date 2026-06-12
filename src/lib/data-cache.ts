"use client";

import { apiFetch } from "@/lib/api-client";
import type { MoveProfile } from "@/lib/move-profile";
import type { VehicleInfo } from "@/lib/vehicles/types";
import type { InventoryBox } from "@/lib/inventory/types";
import type { ChecklistTask, DocumentItem } from "@/lib/types";

export interface UserDataPayload {
  user: { id: string; email: string; name: string };
  moveId: string;
  profile: MoveProfile;
  destinationAddress: string;
  destinationLat?: number;
  destinationLon?: number;
  isAddressConfirmed: boolean;
  vehicles: VehicleInfo[];
  inventory: InventoryBox[];
  checklist: ChecklistTask[];
  documents: (DocumentItem & { fileName?: string; hasFile?: boolean })[];
  moveRole?: "owner" | "editor" | "viewer";
  ownerName?: string;
  canEdit?: boolean;
  canEditProfile?: boolean;
}

let cached: UserDataPayload | null = null;
let cachedEmail: string | null = null;

export function invalidateUserData() {
  cached = null;
  cachedEmail = null;
}

export async function loadUserData(email: string, force = false): Promise<UserDataPayload> {
  const key = email.trim().toLowerCase();
  if (!force && cached && cachedEmail === key) return cached;
  const res = await apiFetch("/api/data");
  const data = (await res.json()) as UserDataPayload;
  cached = data;
  cachedEmail = key;
  return data;
}
