import type { Locale } from "@/lib/i18n";
import { translate } from "@/lib/i18n";
import { listMoveActivities, logMoveActivity } from "@/lib/db/activity";

export { logMoveActivity };

export interface MoveActivityItem {
  id: string;
  action: string;
  details: Record<string, unknown> | null;
  createdAt: string;
  userName: string;
}

export async function getRecentMoveActivities(moveId: string, limit = 20): Promise<MoveActivityItem[]> {
  const rows = await listMoveActivities(moveId, limit);
  return rows.map((row) => ({
    id: row.id,
    action: row.action,
    details: (row.details as Record<string, unknown> | null) ?? null,
    createdAt: row.createdAt,
    userName: row.userName,
  }));
}

export function formatActivityLabel(
  activity: MoveActivityItem,
  locale: Locale = "en"
): string {
  const key = `moveActivity.${activity.action}`;
  const label = translate(locale, key, {
    name: activity.userName,
    ...(activity.details ?? {}),
  } as Record<string, string | number>);
  if (label !== key) return label;
  return translate(locale, "moveActivity.generic", { name: activity.userName });
}
