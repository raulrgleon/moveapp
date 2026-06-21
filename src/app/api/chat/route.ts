import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { buildMoveSystemPromptAsync } from "@/lib/ai/move-context";
import {
  getLatestUserMessage,
  resolveReplyLocale,
  buildReplyLanguageReminder,
} from "@/lib/ai/detect-message-locale";
import { loadMoveContextFromDb } from "@/lib/ai/load-move-context-from-db";
import type { Locale } from "@/lib/i18n";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
import { requireProSubscription } from "@/lib/billing/require-pro";
import { requireMoveAccess } from "@/lib/api-auth";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function trimChatHistory(userId: string) {
  const excess = await prisma.chatMessage.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    skip: 20,
    select: { id: true },
  });
  if (excess.length > 0) {
    await prisma.chatMessage.deleteMany({
      where: { id: { in: excess.map((e) => e.id) } },
    });
  }
}

export async function GET(req: NextRequest) {
  const proCheck = await requireProSubscription(req);
  if (proCheck instanceof NextResponse) return proCheck;
  const result = await requireMoveAccess(req);
  if (result instanceof NextResponse) return result;

  const rows = await prisma.chatMessage.findMany({
    where: { userId: result.user.id },
    orderBy: { createdAt: "asc" },
    take: 20,
  });

  return NextResponse.json({
    messages: rows.map((r) => ({
      id: r.id,
      role: r.role as "user" | "assistant",
      content: r.content,
    })),
  });
}

export async function POST(req: NextRequest) {
  const proCheck = await requireProSubscription(req);
  if (proCheck instanceof NextResponse) return proCheck;
  if (!process.env.OPENAI_API_KEY) {
    return new Response("OpenAI API key not configured", { status: 500 });
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  const limit = await rateLimit(`chat:${ip}`, 30, 60_000);
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

    const accessResult = await requireMoveAccess(req);
    if (accessResult instanceof NextResponse) return accessResult;

    const lastUserText = getLatestUserMessage(messages);
    const appLocale = (locale ?? "en") as Locale;
    const replyLocale = resolveReplyLocale(lastUserText, appLocale);

    const dbContext = await loadMoveContextFromDb(accessResult.access, {
      locale: appLocale,
      userMessage: lastUserText,
    });

    if (!dbContext) {
      return new Response("Move not found", { status: 404 });
    }

    const systemPrompt = await buildMoveSystemPromptAsync({
      ...dbContext,
      locale: appLocale,
      userMessage: lastUserText,
    });
    const languageReminder = buildReplyLanguageReminder(replyLocale);

    const userId = accessResult.user.id;
    const lastUser = messages.filter((m) => m.role === "user").pop();
    if (lastUser?.content) {
      await prisma.chatMessage.create({
        data: { userId, role: "user", content: lastUser.content },
      });
      await trimChatHistory(userId);
    }

    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
    const stream = await openai.chat.completions.create({
      model,
      stream: true,
      temperature: 0.45,
      max_tokens: 900,
      messages: [
        {
          role: "system",
          content: systemPrompt,
        },
        {
          role: "system",
          content: languageReminder,
        },
        ...messages.slice(-6).map((m) => ({
          role: m.role,
          content: m.content,
        })),
      ],
    });

    const encoder = new TextEncoder();
    let assistantFull = "";

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices[0]?.delta?.content ?? "";
            if (text) {
              assistantFull += text;
              controller.enqueue(encoder.encode(text));
            }
          }
        } catch (err) {
          controller.error(err);
        } finally {
          if (userId && assistantFull.trim()) {
            await prisma.chatMessage.create({
              data: { userId, role: "assistant", content: assistantFull },
            });
            await trimChatHistory(userId);
          }
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
    console.error("Chat API error:", error);
    return new Response("Failed to generate response", { status: 500 });
  }
}
