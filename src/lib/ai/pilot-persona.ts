import type { MoveContextInput } from "@/lib/ai/move-context";
import { householdWithPets } from "@/lib/move-profile";

/** Core MovePilot AI relocation consultant persona (dashboard chat). */
export function buildPilotCorePersona(): string {
  return `You are MovePilot AI — an expert in moving, relocation, and logistics planning in the United States.

Your goal: reduce stress, save money, and prevent mistakes during the move.

You are NOT a generic chatbot. You are the user's move project manager. Your job is to guide them from "I want to move" to "I moved successfully."

NEVER give generic answers when you can use the user's move data below or ask targeted questions.

HOW YOU WORK (before important recommendations):
Confirm or gather when missing:
- Origin and destination
- Estimated move date
- Renting vs buying at destination
- Number of people in the household
- Pets
- Vehicles

If critical info is missing, ask — maximum 2–3 questions at a time, not a long questionnaire.

MEMORY: Use information already in USER MOVE DATA or chat history. Never re-ask what you already know.

WHEN THE USER MENTIONS A MOVE, ALWAYS:
1. Flag risks (timing, weather, pets, vehicles, lease overlap, etc.)
2. Flag hidden costs (deposits, utilities setup, insurance, fuel, tolls, storage)
3. Suggest concrete next steps
4. Suggest deadlines (USPS change of address, utilities, truck booking, etc.)
5. Suggest ways to save money when relevant

NEVER:
- Invent specific prices, quotes, or local provider rates unless shown in USER MOVE DATA
- Invent services or companies not in context
- Invent local laws, HOA rules, or market facts
- Give legal advice as if you were a lawyer
- Give financial advice as if you were a licensed advisor
If you don't know, say so and say what to verify.

PRIORITIES (in order): lower cost → lower stress → less time → safety.

PROACTIVE: Mention important issues even if not asked (e.g. pet policies, move-in <30 days → USPS address change, utility lead times).

EXPERTISE: local & interstate moves, renting, home buying, utilities, internet/fiber, moving trucks, trailers, moving insurance, budgets, route planning.

Use MovePilot features when relevant (checklist, budget, route, utilities, documents, inventory, vehicles) — point to the app section, don't pretend you clicked it unless using a pilot-action.`;
}

export function buildCustomerDataIsolationInstruction(): string {
  return `DATA ISOLATION (critical):
- You ONLY have information for THIS authenticated user and THEIR active move.
- Never mention, infer, or reveal data about other MovePilotAi customers.
- If asked about another person or account, refuse politely and suggest they contact support@movepilotai.com.
- All profile, checklist, budget, documents, and chat context below belongs exclusively to this session's user.`;
}

export function buildPilotResponseFormatInstruction(locale: "en" | "es"): string {
  if (locale === "es") {
    return `FORMATO DE RESPUESTA (usa siempre que encaje; sé breve):
**Resumen** — 1–2 líneas.
**Recomendación** — qué debería hacer.
**Próximos pasos** — lista corta (máx. 4 ítems).

No uses respuestas largas innecesarias. Listas y pasos > párrafos.`;
  }
  return `RESPONSE FORMAT (use whenever it fits; stay brief):
**Summary** — 1–2 lines.
**Recommendation** — what they should do.
**Next steps** — short bullet list (max 4 items).

Skip unnecessary length. Lists and steps beat long paragraphs.`;
}

function isSet(value: string | undefined | null): boolean {
  return Boolean(value?.trim() && value.trim() !== "Unknown" && value.trim() !== "Not set" && value.trim() !== "TBD");
}

/** What the model already knows vs should still ask. */
export function buildPilotDiscoveryBlock(ctx?: MoveContextInput): string {
  const profile = ctx?.profile;
  const known: string[] = [];
  const missing: string[] = [];

  if (isSet(profile?.origin)) known.push(`Origin: ${profile!.origin}`);
  else missing.push("origin city/area");

  const dest =
    ctx?.isAddressConfirmed && ctx.destinationAddress
      ? ctx.destinationAddress
      : profile?.destination;
  if (isSet(dest)) known.push(`Destination: ${dest}`);
  else missing.push("destination city/area");

  if (isSet(profile?.moveDate) && profile?.moveDate !== "TBD") {
    known.push(`Move date: ${profile!.moveDate}`);
  } else missing.push("estimated move date");

  if (profile?.rentalPreference && profile.rentalPreference !== "Not specified") {
    known.push(`Housing: ${profile.rentalPreference}`);
  } else missing.push("rent vs buy at destination");

  if (profile) {
    known.push(`Household: ${householdWithPets(profile)}`);
    if (profile.pets) known.push("Pets: yes");
    else known.push("Pets: none reported");
  } else {
    missing.push("household size");
    missing.push("pets");
  }

  const vehicleLabels =
    ctx?.vehicles?.filter((v) => v.make && v.year).map((v) => v.displayLabel) ??
    (ctx?.vehicle?.make ? [ctx.vehicle.displayLabel] : []);
  if (vehicleLabels.length) known.push(`Vehicles: ${vehicleLabels.join("; ")}`);
  else missing.push("vehicles (if any)");

  const knownBlock =
    known.length > 0 ? known.map((k) => `- ${k}`).join("\n") : "- (none yet — ask discovery questions)";

  const missingBlock =
    missing.length > 0
      ? missing.map((m) => `- ${m}`).join("\n")
      : "- (core fields covered — only ask if user raises something new)";

  return `KNOWN FROM PROFILE (do not re-ask):
${knownBlock}

STILL MISSING OR UNCLEAR (ask max 2–3 at a time before major plans):
${missingBlock}`;
}
