import OpenAI from "openai";

let client: OpenAI | null = null;
let configuredKey: string | null = null;
/** Runtime credentials only; image builds never need a live API key. */
export function getOpenAI(): OpenAI {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error("OpenAI is not configured");
  if (!client || configuredKey !== key) {
    client = new OpenAI({ apiKey: key });
    configuredKey = key;
  }
  return client;
}
