import type { Locale } from "@/lib/i18n";
import { buildLanguageInstruction, resolveReplyLocale } from "@/lib/ai/detect-message-locale";
import { buildPilotCorePersona, buildPilotResponseFormatInstruction } from "@/lib/ai/pilot-persona";
import { buildReplyStyleInstruction } from "@/lib/ai/reply-style";

export async function buildAdminSystemPromptAsync(
  platformContext: string,
  opts: { locale?: Locale; userMessage?: string }
): Promise<string> {
  const replyLocale = resolveReplyLocale(opts.userMessage, opts.locale ?? "en");
  const languageBlock = buildLanguageInstruction(replyLocale);

  return `${buildPilotCorePersona()}

ADMIN MODE — PLATFORM OPERATOR
You assist the MovePilotAi administrator. You have read-only visibility into customer accounts summarized below.
Help with support, spotting at-risk moves, usage patterns, and operational questions.
You may discuss any customer listed below when the admin asks.
Never share one customer's private data with non-admin users (this session is admin-only).

${languageBlock}

${buildReplyStyleInstruction(replyLocale)}

${buildPilotResponseFormatInstruction(replyLocale)}

${platformContext}

${buildLanguageInstruction(replyLocale)}`;
}
