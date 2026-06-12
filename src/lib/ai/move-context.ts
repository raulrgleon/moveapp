import {
  getUtilityBestPicks,
  sumUtilityMonthlyEstimate,
  formatUtilityPickPrice,
} from "@/lib/utilities/recommendations";
import { fetchUtilitiesForLocation } from "@/lib/utilities/fetch-utilities";
import { householdWithPets, type MoveProfile } from "@/lib/move-profile";
import { buildTrailerRecommendation } from "@/lib/trucks/recommendations";

import type { Locale } from "@/lib/i18n";
import type { DestinationUtilityProvider } from "@/lib/types";
import type { VehicleInfo } from "@/lib/vehicles/types";

export interface RouteContextStats {
  distanceMiles?: number;
  driveTimeLabel?: string;
  totalEstimatedBudget?: number;
  taskCompletionPercent?: number;
}

export interface MoveContextInput {
  profile?: MoveProfile;
  destinationAddress?: string;
  destination?: string;
  lat?: number;
  lon?: number;
  isAddressConfirmed?: boolean;
  vehicle?: VehicleInfo;
  vehicles?: VehicleInfo[];
  locale?: Locale;
  inventorySummary?: string;
  routeStats?: RouteContextStats;
}

async function resolveUtilityPicks(ctx?: MoveContextInput): Promise<{
  picks: DestinationUtilityProvider[];
  monthlyTotal: number;
}> {
  if (
    ctx?.isAddressConfirmed &&
    ctx.lat != null &&
    ctx.lon != null &&
    Number.isFinite(ctx.lat) &&
    Number.isFinite(ctx.lon)
  ) {
    try {
      const { providers } = await fetchUtilitiesForLocation({
        lat: ctx.lat,
        lon: ctx.lon,
        address: ctx.destinationAddress,
      });
      const picks = getUtilityBestPicks(providers);
      return {
        picks,
        monthlyTotal: sumUtilityMonthlyEstimate(picks),
      };
    } catch {
      /* fall through */
    }
  }
  return { picks: [], monthlyTotal: 0 };
}

export async function buildMoveSystemPromptAsync(ctx?: MoveContextInput): Promise<string> {
  const profile = ctx?.profile;

  const address =
    ctx?.isAddressConfirmed && ctx.destinationAddress
      ? ctx.destinationAddress
      : profile?.destination
        ? `${profile.destination} (address not confirmed)`
        : "Not set";

  const origin = profile?.origin ?? "Unknown";
  const destination = ctx?.destination ?? profile?.destination ?? "Unknown";
  const addressNote = ctx?.isAddressConfirmed
    ? `Coordinates: ${ctx.lat}, ${ctx.lon}`
    : "Address not yet confirmed by user — prompt them to set their new home address in Utilities.";

  const { picks: utilityBestPicks, monthlyTotal: utilityMonthlyTotal } =
    await resolveUtilityPicks(ctx);
  const utilityPicks =
    utilityBestPicks.length > 0
      ? utilityBestPicks
          .map((p) => `${p.categoryLabel}: ${p.name} (${formatUtilityPickPrice(p)})`)
          .join("; ")
      : "Not loaded — confirm address in Utilities";

  const replyLanguage =
    ctx?.locale === "es"
      ? "Spanish (español). All user-facing text must be in Spanish."
      : "English. All user-facing text must be in English.";

  const userName = profile?.name ?? "User";
  const moveDate = profile?.moveDate ?? "TBD";
  const household = profile ? householdWithPets(profile) : "Unknown";
  const budget = profile?.budget ?? 0;
  const rental = profile?.rentalPreference ?? "Not specified";

  const miles = ctx?.routeStats?.distanceMiles;
  const driveTime = ctx?.routeStats?.driveTimeLabel ?? "unknown";
  const estTotal = ctx?.routeStats?.totalEstimatedBudget;
  const progress = ctx?.routeStats?.taskCompletionPercent;
  const trailerTip =
    profile && miles
      ? buildTrailerRecommendation(profile, miles, ctx?.vehicles ?? [])
      : "Compare trailer vs truck options once your route is set.";

  return `You are MovePilot AI, a fast and practical moving co-pilot.

LANGUAGE: Reply in ${replyLanguage}

RESPONSE FORMAT (required):
- Use Markdown only. Never plain unformatted paragraphs.
- Start with a **bold one-line summary** when answering questions.
- Use ## headings for sections (max 2-3 sections).
- Use bullet lists (- item) for options and tips.
- Use numbered lists (1. step) for action steps.
- Use **bold** for deadlines, costs, and provider names.
- Keep each paragraph to 1-2 sentences max.
- Max 250 words unless user asks for detail.

USER: ${userName}
FROM: ${origin} → TO: ${destination}
NEW ADDRESS: ${address}
${addressNote}
MOVE DATE: ${moveDate}
HOUSEHOLD: ${household} | PETS: ${profile?.pets ? "yes" : "no"}
VEHICLE(S): ${ctx?.vehicles?.map((v) => v.displayLabel).join("; ") ?? ctx?.vehicle?.displayLabel ?? "Not specified"}
BUDGET: $${budget}${estTotal != null ? ` (est. total $${estTotal})` : ""}
PROGRESS: ${progress != null ? `${progress}%` : "unknown"} | MILES: ${miles ?? "unknown"} | DRIVE: ${driveTime}
RENTAL: ${rental}
TRAILER TIP: ${trailerTip}
UTILITIES (~$${utilityMonthlyTotal}/mo): ${utilityPicks}
INVENTORY BOXES: ${ctx?.inventorySummary ?? "not tracked yet — user can add boxes in Inventory"}

Answer only about this move. If unsure, say what to verify. Prioritize actionable next steps.`;
}

