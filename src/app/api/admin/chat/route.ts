import { NextRequest, NextResponse } from "next/server";
import { jsonErrorFromRequest } from "@/lib/api-errors";
import OpenAI from "openai";
import { buildAdminSystemPromptAsync } from "@/lib/ai/admin-prompt";
import {
  getLatestUserMessage,
  resolveReplyLocale,
  buildReplyLanguageReminder,
} from "@/lib/ai/detect-message-locale";
import { loadAdminPlatformContext } from "@/lib/ai/load-admin-platform-context";
import type { Locale } from "@/lib/i18n";
import { requireAdmin } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";

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
  const admin = await requireAdmin(req);
  if (!admin) {
    return jsonErrorFromRequest(req, "forbidden", 403);
  }

  const rows = await prisma.chatMessage.findMany({
    where: { userId: admin.id },
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
  const admin = await requireAdmin(req);
  if (!admin) {
    return jsonErrorFromRequest(req, "forbidden", 403);
  }

  if (!process.env.OPENAI_API_KEY) {
    return new Response("OpenAI API key not configured", { status: 500 });
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  const limit = await rateLimit(`admin-chat:${ip}`, 30, 60_000);
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

    const lastUserText = getLatestUserMessage(messages);
    const appLocale = (locale ?? (admin.locale === "es" ? "es" : "en")) as Locale;
    const replyLocale = resolveReplyLocale(lastUserText, appLocale);
    const platformContext = await loadAdminPlatformContext();
    const systemPrompt = await buildAdminSystemPromptAsync(platformContext, {
      locale: appLocale,
      userMessage: lastUserText,
    });
    const languageReminder = buildReplyLanguageReminder(replyLocale);

    const lastUser = messages.filter((m) => m.role === "user").pop();
    if (lastUser?.content) {
      await prisma.chatMessage.create({
        data: { userId: admin.id, role: "user", content: lastUser.content },
      });
      await trimChatHistory(admin.id);
    }

    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
    const stream = await openai.chat.completions.create({
      model,
      stream: true,
      temperature: 0.45,
      max_tokens: 900,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "system", content: languageReminder },
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
          if (assistantFull.trim()) {
            await prisma.chatMessage.create({
              data: { userId: admin.id, role: "assistant", content: assistantFull },
            });
            await trimChatHistory(admin.id);
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
    console.error("Admin chat API error:", error);
    return new Response("Failed to generate response", { status: 500 });
  }
}
