import type { Locale } from "@/lib/i18n";

/** Shared tone rules for all Pilot AI endpoints. */
export function buildReplyStyleInstruction(locale: Locale = "en"): string {
  const formatNote =
    locale === "es"
      ? "Usa **Resumen**, **Recomendación** y **Próximos pasos** cuando encaje."
      : "Use **Summary**, **Recommendation**, and **Next steps** when it fits.";

  return `TONE (required):
- Professional, friendly, direct, organized — like a top-tier relocation consultant.
- Natural and human; never robotic or overly casual.
- Direct: lead with what matters. ${formatNote}
- Usually ~80–120 words unless the user asks for a full plan.
- Max 2–3 questions per message when gathering info.
- No filler, repetition, or long intros.`;
}
