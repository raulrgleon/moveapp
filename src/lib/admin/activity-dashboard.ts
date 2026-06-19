import type { Locale } from "@/lib/i18n";
import { translate } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";

export const ACTIVITY_CATEGORIES = [
  "all",
  "admin",
  "users",
  "moves",
  "profile",
  "budget",
  "checklist",
  "documents",
  "collaboration",
  "utilities",
  "trucks",
  "partners",
  "system",
] as const;

export type ActivityCategory = (typeof ACTIVITY_CATEGORIES)[number];
export type ActivitySource = "admin" | "user" | "partner";

export interface UnifiedActivityItem {
  id: string;
  source: ActivitySource;
  category: Exclude<ActivityCategory, "all">;
  action: string;
  createdAt: string;
  actorName: string;
  actorEmail: string;
  moveId?: string;
  moveRoute?: string;
  targetType?: string | null;
  targetId?: string | null;
  details?: Record<string, unknown> | null;
  ipAddress?: string | null;
}

export interface ActivityCategoryCount {
  category: Exclude<ActivityCategory, "all">;
  count: number;
}

export interface ActivityDashboardSummary {
  totalToday: number;
  totalWeek: number;
  adminToday: number;
  userToday: number;
  partnerToday: number;
  byCategory: ActivityCategoryCount[];
}

export interface ActivityDashboardResult {
  summary: ActivityDashboardSummary;
  items: UnifiedActivityItem[];
}

function categorizeAdminAction(action: string): Exclude<ActivityCategory, "all"> {
  if (action.startsWith("moving_partner") || action.includes("partner")) return "partners";
  if (action.startsWith("user.")) return "users";
  if (action.startsWith("move.")) return "moves";
  if (action.startsWith("announcement")) return "system";
  if (action.startsWith("maintenance") || action.startsWith("session")) return "system";
  if (action.startsWith("impersonate")) return "system";
  if (action.startsWith("document")) return "documents";
  if (action.startsWith("invite")) return "collaboration";
  return "admin";
}

function categorizeMoveAction(action: string): Exclude<ActivityCategory, "all"> {
  switch (action) {
    case "profile_updated":
    case "address_confirmed":
      return "profile";
    case "budget_updated":
      return "budget";
    case "checklist_complete":
      return "checklist";
    case "document_upload":
      return "documents";
    case "invite_sent":
    case "invite_accepted":
    case "invite_removed":
      return "collaboration";
    case "utility_contracted":
      return "utilities";
    case "truck_choice_saved":
    case "vehicle_transport_saved":
      return "trucks";
    default:
      return "profile";
  }
}

function routeLabel(origin: string, destination: string): string {
  return `${origin} → ${destination}`;
}

function detailsRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

export function formatAdminActivityLabel(
  item: UnifiedActivityItem,
  locale: Locale
): string {
  const key = `adminActivity.actions.${item.action.replace(/\./g, "_")}`;
  const params: Record<string, string | number> = {
    name: item.actorName,
    ...(item.details ?? {}),
  } as Record<string, string | number>;
  const label = translate(locale, key, params);
  if (label !== key) return label;
  return translate(locale, "adminActivity.actions.generic", {
    name: item.actorName,
    action: item.action,
  });
}

export function formatUserActivityLabel(item: UnifiedActivityItem, locale: Locale): string {
  const key = `moveActivity.${item.action}`;
  const params: Record<string, string | number> = {
    name: item.actorName,
    ...(item.details ?? {}),
  } as Record<string, string | number>;
  const label = translate(locale, key, params);
  if (label !== key) {
    return label;
  }
  return translate(locale, "moveActivity.generic", { name: item.actorName });
}

export function formatPartnerActivityLabel(item: UnifiedActivityItem, locale: Locale): string {
  return translate(locale, "adminActivity.actions.partner_quote_submitted", {
    company: String(item.details?.companyName ?? item.actorName),
    route: item.moveRoute ?? "",
  });
}

export function formatActivityLabel(item: UnifiedActivityItem, locale: Locale): string {
  if (item.source === "admin") return formatAdminActivityLabel(item, locale);
  if (item.source === "partner") return formatPartnerActivityLabel(item, locale);
  return formatUserActivityLabel(item, locale);
}

function startOfDay(date = new Date()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function buildSummary(items: UnifiedActivityItem[]): ActivityDashboardSummary {
  const todayStart = startOfDay();
  const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  let totalToday = 0;
  let totalWeek = 0;
  let adminToday = 0;
  let userToday = 0;
  let partnerToday = 0;
  const categoryMap = new Map<Exclude<ActivityCategory, "all">, number>();

  for (const item of items) {
    const at = new Date(item.createdAt);
    if (at >= weekStart) {
      totalWeek += 1;
      categoryMap.set(item.category, (categoryMap.get(item.category) ?? 0) + 1);
    }
    if (at >= todayStart) {
      totalToday += 1;
      if (item.source === "admin") adminToday += 1;
      if (item.source === "user") userToday += 1;
      if (item.source === "partner") partnerToday += 1;
    }
  }

  const byCategory = Array.from(categoryMap.entries())
    .map(([category, count]) => ({ category, count }))
    .sort((a, b) => b.count - a.count);

  return {
    totalToday,
    totalWeek,
    adminToday,
    userToday,
    partnerToday,
    byCategory,
  };
}

function matchesSearch(item: UnifiedActivityItem, query: string): boolean {
  const hay = [
    item.action,
    item.actorName,
    item.actorEmail,
    item.moveRoute,
    item.targetType,
    item.targetId,
    JSON.stringify(item.details ?? {}),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return hay.includes(query);
}

export async function fetchActivityDashboard(input: {
  limit?: number;
  source?: "all" | ActivitySource;
  category?: ActivityCategory;
  q?: string;
}): Promise<ActivityDashboardResult> {
  const limit = Math.min(Math.max(input.limit ?? 120, 20), 300);
  const fetchEach = limit;

  const [adminLogs, moveActivities, partnerQuotes] = await Promise.all([
    input.source === "user" || input.source === "partner"
      ? []
      : prisma.adminAuditLog.findMany({
          orderBy: { createdAt: "desc" },
          take: fetchEach,
          include: {
            admin: { select: { name: true, email: true } },
          },
        }),
    input.source === "admin" || input.source === "partner"
      ? []
      : prisma.moveActivity.findMany({
          orderBy: { createdAt: "desc" },
          take: fetchEach,
          include: {
            user: { select: { name: true, email: true } },
            move: { select: { id: true, origin: true, destination: true } },
          },
        }),
    input.source === "admin" || input.source === "user"
      ? []
      : prisma.partnerQuote.findMany({
          orderBy: { createdAt: "desc" },
          take: Math.min(fetchEach, 80),
          include: {
            move: {
              select: {
                id: true,
                origin: true,
                destination: true,
                user: { select: { name: true, email: true } },
              },
            },
          },
        }),
  ]);

  const unified: UnifiedActivityItem[] = [];

  for (const log of adminLogs) {
    unified.push({
      id: `admin-${log.id}`,
      source: "admin",
      category: categorizeAdminAction(log.action),
      action: log.action,
      createdAt: log.createdAt.toISOString(),
      actorName: log.admin.name,
      actorEmail: log.admin.email,
      targetType: log.targetType,
      targetId: log.targetId,
      details: detailsRecord(log.details),
      ipAddress: log.ipAddress,
    });
  }

  for (const row of moveActivities) {
    unified.push({
      id: `move-${row.id}`,
      source: "user",
      category: categorizeMoveAction(row.action),
      action: row.action,
      createdAt: row.createdAt.toISOString(),
      actorName: row.user.name,
      actorEmail: row.user.email,
      moveId: row.move.id,
      moveRoute: routeLabel(row.move.origin, row.move.destination),
      details: detailsRecord(row.details),
    });
  }

  for (const quote of partnerQuotes) {
    unified.push({
      id: `quote-${quote.id}`,
      source: "partner",
      category: "partners",
      action: "partner_quote.submitted",
      createdAt: quote.createdAt.toISOString(),
      actorName: quote.companyName,
      actorEmail: quote.contactEmail,
      moveId: quote.move.id,
      moveRoute: routeLabel(quote.move.origin, quote.move.destination),
      details: {
        companyName: quote.companyName,
        amount: quote.amount,
        status: quote.status,
        ownerName: quote.move.user.name,
        ownerEmail: quote.move.user.email,
      },
    });
  }

  unified.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const weekItems = unified.filter(
    (item) => new Date(item.createdAt) >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  );
  const summary = buildSummary(weekItems);

  let items = unified;

  if (input.category && input.category !== "all") {
    items = items.filter((item) => item.category === input.category);
  }

  if (input.q?.trim()) {
    const q = input.q.trim().toLowerCase();
    items = items.filter((item) => matchesSearch(item, q));
  }

  return {
    summary,
    items: items.slice(0, limit),
  };
}

export function groupActivitiesByDay(
  items: UnifiedActivityItem[],
  locale: Locale
): { dayKey: string; dayLabel: string; items: UnifiedActivityItem[] }[] {
  const groups = new Map<string, UnifiedActivityItem[]>();

  for (const item of items) {
    const dayKey = item.createdAt.slice(0, 10);
    const bucket = groups.get(dayKey) ?? [];
    bucket.push(item);
    groups.set(dayKey, bucket);
  }

  const todayKey = new Date().toISOString().slice(0, 10);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = yesterday.toISOString().slice(0, 10);

  return Array.from(groups.entries()).map(([dayKey, dayItems]) => {
    let dayLabel = new Date(`${dayKey}T12:00:00`).toLocaleDateString(
      locale === "es" ? "es-US" : "en-US",
      { weekday: "long", month: "short", day: "numeric", year: "numeric" }
    );
    if (dayKey === todayKey) {
      dayLabel = translate(locale, "adminActivity.today");
    } else if (dayKey === yesterdayKey) {
      dayLabel = translate(locale, "adminActivity.yesterday");
    }
    return { dayKey, dayLabel, items: dayItems };
  });
}
