import type { Locale } from "@/lib/i18n";

const SPANISH_WORDS = new Set([
  "qué",
  "que",
  "cómo",
  "como",
  "cuándo",
  "cuando",
  "dónde",
  "donde",
  "cuál",
  "cual",
  "cuales",
  "cuáles",
  "hola",
  "gracias",
  "por",
  "para",
  "con",
  "mudanza",
  "mudarme",
  "mudanzas",
  "necesito",
  "tengo",
  "puedo",
  "debo",
  "está",
  "esta",
  "estoy",
  "son",
  "mis",
  "tus",
  "del",
  "al",
  "hay",
  "también",
  "tambien",
  "más",
  "mas",
  "muy",
  "todo",
  "todos",
  "todas",
  "este",
  "esta",
  "estos",
  "estas",
  "quiero",
  "ayuda",
  "presupuesto",
  "lista",
  "ruta",
  "camión",
  "camion",
  "español",
  "espanol",
  "favor",
  "hacer",
  "tarea",
  "tareas",
  "documentos",
  "servicios",
  "cajas",
  "caja",
]);

const ENGLISH_WORDS = new Set([
  "what",
  "how",
  "when",
  "where",
  "why",
  "can",
  "should",
  "could",
  "would",
  "does",
  "do",
  "is",
  "are",
  "my",
  "the",
  "move",
  "moving",
  "need",
  "help",
  "budget",
  "checklist",
  "route",
  "truck",
  "box",
  "boxes",
  "please",
  "thanks",
  "hello",
  "hi",
]);

/** Infer reply language from the user's message text (falls back to app locale). */
export function detectMessageLocale(text: string, fallback: Locale = "en"): Locale {
  const trimmed = text.trim();
  if (!trimmed) return fallback;

  if (/[áéíóúñü¿¡]/i.test(trimmed)) return "es";

  const words = trimmed.toLowerCase().split(/\s+/);
  let esScore = 0;
  let enScore = 0;

  for (const raw of words) {
    const word = raw.replace(/[^\wáéíóúñü]/gi, "");
    if (!word) continue;
    if (SPANISH_WORDS.has(word)) esScore += 1;
    if (ENGLISH_WORDS.has(word)) enScore += 1;
  }

  if (esScore > enScore) return "es";
  if (enScore > esScore) return "en";
  return fallback;
}

export function getLatestUserMessage(
  messages: { role: string; content: string }[]
): string | undefined {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].role === "user" && messages[i].content.trim()) {
      return messages[i].content.trim();
    }
  }
  return undefined;
}

export function resolveReplyLocale(
  userMessage: string | undefined,
  fallback: Locale = "en"
): Locale {
  if (!userMessage) return fallback;
  return detectMessageLocale(userMessage, fallback);
}

export function buildLanguageInstruction(replyLocale: Locale): string {
  const lang = replyLocale === "es" ? "Spanish (español)" : "English";
  return `CRITICAL LANGUAGE RULE: Reply entirely in ${lang}.
- Match the language of the user's latest message — not the app UI setting.
- If the user switches language mid-conversation, switch immediately.
- Do not mix languages unless quoting a name or address.`;
}
