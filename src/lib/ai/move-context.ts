import {
  MOCK_USER,
  MOVE_STATS,
  UTILITY_AI_SUMMARY,
  TRAILER_RECOMMENDATION,
} from "@/lib/mock-data";

export interface MoveContextInput {
  destinationAddress?: string;
  destination?: string;
  lat?: number;
  lon?: number;
  isAddressConfirmed?: boolean;
}

/** Compact move context for fast, grounded AI responses. */
export function buildMoveSystemPrompt(ctx?: MoveContextInput): string {
  const address =
    ctx?.isAddressConfirmed && ctx.destinationAddress
      ? ctx.destinationAddress
      : MOCK_USER.destinationAddress;

  const destination = ctx?.destination ?? MOCK_USER.destination;
  const addressNote = ctx?.isAddressConfirmed
    ? `Coordinates: ${ctx.lat}, ${ctx.lon}`
    : "Address not yet confirmed by user — prompt them to set their new home address in Utilities.";

  const utilityPicks = UTILITY_AI_SUMMARY.bestPicks
    .map((p) => `${p.category}: ${p.provider}`)
    .join("; ");

  return `You are MovePilot AI, a fast and practical moving co-pilot.

RESPONSE FORMAT (required):
- Use Markdown only. Never plain unformatted paragraphs.
- Start with a **bold one-line summary** when answering questions.
- Use ## headings for sections (max 2-3 sections).
- Use bullet lists (- item) for options and tips.
- Use numbered lists (1. step) for action steps.
- Use **bold** for deadlines, costs, and provider names.
- Keep each paragraph to 1-2 sentences max.
- Max 250 words unless user asks for detail.

USER: ${MOCK_USER.name}
FROM: ${MOCK_USER.origin} → TO: ${destination}
NEW ADDRESS: ${address}
${addressNote}
MOVE DATE: ${MOCK_USER.moveDate}
HOUSEHOLD: ${MOCK_USER.household} | PETS: ${MOCK_USER.pets ? "yes" : "no"}
VEHICLE: ${MOCK_USER.vehicles.join(", ")}
BUDGET: $${MOCK_USER.budget} (est. total $${MOVE_STATS.estimatedTotalBudget})
PROGRESS: ${MOVE_STATS.taskCompletionPercent}% | MILES: ${MOVE_STATS.totalMiles} | DRIVE: ${MOVE_STATS.estimatedDriveTime}
RENTAL: ${MOCK_USER.rentalPreference}
TRAILER TIP: ${TRAILER_RECOMMENDATION}
UTILITIES (~$${UTILITY_AI_SUMMARY.estimatedMonthlyTotal}/mo): ${utilityPicks}

Answer only about this move. If unsure, say what to verify. Prioritize actionable next steps.`;
}
