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
  "porqué",
  "porque",
  "hola",
  "gracias",
  "por",
  "para",
  "con",
  "sin",
  "sobre",
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
  "están",
  "son",
  "mis",
  "tus",
  "sus",
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
  "estos",
  "estas",
  "quiero",
  "ayuda",
  "presupuesto",
  "lista",
  "ruta",
  "camión",
  "camion",
  "remolque",
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
  "casa",
  "hogar",
  "mejor",
  "debo",
  "debería",
  "deberia",
  "cuanto",
  "cuánto",
  "cuantos",
  "cuántos",
  "algún",
  "algun",
  "alguna",
  "ningún",
  "ningun",
  "ninguna",
  "días",
  "dias",
  "semana",
  "antes",
  "después",
  "despues",
  "ahora",
  "todavía",
  "todavia",
  "también",
  "bien",
  "mal",
  "sí",
  "si",
  "no",
  "el",
  "la",
  "los",
  "las",
  "un",
  "una",
  "unos",
  "unas",
  "mi",
  "tu",
  "su",
  "nuestro",
  "nuestra",
  "vuestro",
  "empacar",
  "empaque",
  "mascota",
  "mascotas",
  "perro",
  "gato",
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

  // Spanish question patterns without accents
  if (/\b(como|que|donde|cuando|cual|cuanto|debo|puedo|necesito|tengo|quiero)\b/i.test(trimmed)) {
    esScore += 2;
  }

  if (esScore > enScore) return "es";
  if (enScore > esScore) return "en";

  // Tie-break: Spanish function words common in short prompts
  if (/\b(para|con|del|al|una|uno|las|los|mis|tu|su)\b/i.test(trimmed)) return "es";

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
- If the user writes in Spanish, every word of your reply must be in Spanish.
- If the user writes in English, every word of your reply must be in English.
- If the user switches language mid-conversation, switch immediately.
- Do not mix languages unless quoting a name, address, or brand.`;
}

/** Short reminder injected alongside the system prompt for each API call. */
export function buildReplyLanguageReminder(replyLocale: Locale): string {
  const lang = replyLocale === "es" ? "Spanish (español)" : "English";
  return `[Reply language: ${lang}] The user's latest message is in ${lang}. Your entire response must be written only in ${lang}.`;
}
