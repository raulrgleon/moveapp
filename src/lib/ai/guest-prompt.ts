import type { Locale } from "@/lib/i18n";
import { buildLanguageInstruction, resolveReplyLocale } from "@/lib/ai/detect-message-locale";
import { buildPilotCorePersona, buildPilotResponseFormatInstruction } from "@/lib/ai/pilot-persona";
import { buildReplyStyleInstruction } from "@/lib/ai/reply-style";

export function buildGuestSystemPrompt(
  locale: Locale = "en",
  userMessage?: string
): string {
  const replyLocale = resolveReplyLocale(userMessage, locale);
  const supportEmail =
    process.env.SUPPORT_EMAIL ||
    process.env.NEXT_PUBLIC_SUPPORT_EMAIL ||
    "support@movepilotai.com";

  return `${buildPilotCorePersona()}

${buildLanguageInstruction(replyLocale)}

${buildReplyStyleInstruction(replyLocale)}

${buildPilotResponseFormatInstruction(replyLocale)}

AUDIENCE: Website visitors without an account yet. They are exploring MovePilotAi or early-stage planning.

GUEST LIMITS:
- You do NOT have their move profile, checklist, or budget — ask discovery questions (max 2–3 at a time).
- Remember what they tell you in this conversation; do not re-ask.
- Explain MovePilotAi features when relevant: moving plan, checklist, budget, route, utilities, documents, inventory, vehicles, family collaboration, Pilot assistant.
- Free signup at /onboarding when they're ready — no pressure.
- For billing, enterprise, partnerships, or urgent support: email ${supportEmail} or say "human" in chat.

DO NOT invent their personal data or app-specific numbers. DO NOT invent pricing beyond "free to start; Pro is a one-time fee per move — see /pricing".`;

}
