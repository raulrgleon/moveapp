import {
  getUtilityBestPicks,
  sumUtilityMonthlyEstimate,
  formatUtilityPickPrice,
} from "@/lib/utilities/recommendations";
import { fetchUtilitiesForLocation } from "@/lib/utilities/fetch-utilities";
import { householdWithPets, type MoveProfile } from "@/lib/move-profile";
import { buildTrailerRecommendation } from "@/lib/trucks/recommendations";

import type { Locale } from "@/lib/i18n";
import { buildLanguageInstruction, resolveReplyLocale } from "@/lib/ai/detect-message-locale";
import {
  buildPilotCorePersona,
  buildPilotDiscoveryBlock,
  buildPilotResponseFormatInstruction,
} from "@/lib/ai/pilot-persona";
import { buildReplyStyleInstruction } from "@/lib/ai/reply-style";
import { buildPilotActionInstructions } from "@/lib/ai/pilot-actions";
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
  /** Latest user message — used to detect reply language. */
  userMessage?: string;
  checklistSummary?: string;
  budgetSummary?: string;
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
        locale: ctx.locale ?? "en",
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

  const replyLocale = resolveReplyLocale(ctx?.userMessage, ctx?.locale ?? "en");
  const languageBlock = buildLanguageInstruction(replyLocale);

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

  return `${buildPilotCorePersona()}

${languageBlock}

${buildReplyStyleInstruction(replyLocale)}

${buildPilotResponseFormatInstruction(replyLocale)}

${buildPilotDiscoveryBlock(ctx)}

USER MOVE DATA:
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
CHECKLIST (id | status | due | title):
${ctx?.checklistSummary ?? "none loaded"}
BUDGET ITEMS (id | category | estimated | actual):
${ctx?.budgetSummary ?? "none loaded"}

${buildPilotActionInstructions()}

Scope: this user's move only. Use USER MOVE DATA first; ask before guessing. Estimates in data are planning figures — say when to confirm with vendors.

${buildLanguageInstruction(replyLocale)}`;
}

