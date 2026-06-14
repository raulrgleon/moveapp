import { NextRequest } from "next/server";
import OpenAI from "openai";
import { buildGuestSystemPrompt } from "@/lib/ai/guest-prompt";
import { getLatestUserMessage, resolveReplyLocale, buildReplyLanguageReminder } from "@/lib/ai/detect-message-locale";
import { rateLimit } from "@/lib/rate-limit";
import type { Locale } from "@/lib/i18n";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return new Response("OpenAI API key not configured", { status: 500 });
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  const limit = rateLimit(`guest-chat:${ip}`, 20, 60_000);
  if (!limit.ok) {
    return new Response("Too many requests. Please try again later.", {
      status: 429,
      headers: limit.retryAfterSec
        ? { "Retry-After": String(limit.retryAfterSec) }
        : undefined,
    });
  }

  try {
    const { messages, locale } = (await req.json()) as {
      messages: { role: "user" | "assistant"; content: string }[];
      locale?: Locale;
    };

    if (!messages?.length) {
      return new Response("Messages required", { status: 400 });
    }

    const last = messages.filter((m) => m.role === "user").pop();
    if (!last?.content?.trim() || last.content.length > 2000) {
      return new Response("Invalid message", { status: 400 });
    }

    const lang: Locale = locale === "es" ? "es" : "en";
    const lastUserText = getLatestUserMessage(messages);
    const replyLocale = resolveReplyLocale(lastUserText, lang);
    const languageReminder = buildReplyLanguageReminder(replyLocale);
    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

    const stream = await openai.chat.completions.create({
      model,
      stream: true,
      temperature: 0.5,
      max_tokens: 280,
      messages: [
        { role: "system", content: buildGuestSystemPrompt(lang, lastUserText) },
        { role: "system", content: languageReminder },
        ...messages.slice(-8).map((m) => ({
          role: m.role,
          content: m.content.slice(0, 4000),
        })),
      ],
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content ?? "";
            if (text) controller.enqueue(encoder.encode(text));
          }
        } catch (err) {
          controller.error(err);
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Guest chat API error:", error);
    return new Response("Failed to generate response", { status: 500 });
  }
}
