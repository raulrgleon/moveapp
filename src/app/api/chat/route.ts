import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { buildMoveSystemPromptAsync, type MoveContextInput } from "@/lib/ai/move-context";
import { getLatestUserMessage } from "@/lib/ai/detect-message-locale";
import { prisma } from "@/lib/prisma";
import { rateLimit } from "@/lib/rate-limit";
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
  if (!process.env.OPENAI_API_KEY) {
    return new Response("OpenAI API key not configured", { status: 500 });
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  const limit = rateLimit(`chat:${ip}`, 30, 60_000);
  if (!limit.ok) {
    return new Response("Too many requests. Please try again later.", {
      status: 429,
      headers: limit.retryAfterSec
        ? { "Retry-After": String(limit.retryAfterSec) }
        : undefined,
    });
  }

  try {
    const { messages, moveContext, locale } = (await req.json()) as {
      messages: { role: "user" | "assistant"; content: string }[];
      moveContext?: MoveContextInput;
      locale?: MoveContextInput["locale"];
    };

    if (!messages?.length) {
      return new Response("Messages required", { status: 400 });
    }

    const accessResult = await requireMoveAccess(req);
    const userId =
      accessResult instanceof NextResponse ? null : accessResult.user.id;

    let enrichedContext = moveContext;
    if (userId && !(accessResult instanceof NextResponse)) {
      const [tasks, budgetItems] = await Promise.all([
        prisma.checklistTask.findMany({
          where: { moveId: accessResult.access.moveId },
          orderBy: { dueDate: "asc" },
          take: 20,
        }),
        prisma.budgetItem.findMany({
          where: { moveId: accessResult.access.moveId },
          orderBy: { sortOrder: "asc" },
        }),
      ]);
      enrichedContext = {
        ...moveContext,
        checklistSummary:
          tasks.length > 0
            ? tasks
                .map(
                  (t) =>
                    `${t.id} | ${t.status} | ${t.dueDate?.toISOString().slice(0, 10) ?? "no date"} | ${t.title}`
                )
                .join("\n")
            : "none",
        budgetSummary:
          budgetItems.length > 0
            ? budgetItems
                .map((b) => `${b.id} | ${b.category} | est $${b.estimated} | actual $${b.actual}`)
                .join("\n")
            : "none",
      };
    }

    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
    const lastUserText = getLatestUserMessage(messages);
    const systemPrompt = await buildMoveSystemPromptAsync({
      ...enrichedContext,
      locale: locale ?? moveContext?.locale,
      userMessage: lastUserText,
    });

    const lastUser = messages.filter((m) => m.role === "user").pop();
    if (userId && lastUser?.content) {
      await prisma.chatMessage.create({
        data: { userId, role: "user", content: lastUser.content },
      });
      await trimChatHistory(userId);
    }

    const stream = await openai.chat.completions.create({
      model,
      stream: true,
      temperature: 0.5,
      max_tokens: 280,
      messages: [
        {
          role: "system",
          content: systemPrompt,
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
