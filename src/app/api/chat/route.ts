import { NextRequest } from "next/server";
import OpenAI from "openai";
import { buildMoveSystemPrompt, type MoveContextInput } from "@/lib/ai/move-context";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  if (!process.env.OPENAI_API_KEY) {
    return new Response("OpenAI API key not configured", { status: 500 });
  }

  try {
    const { messages, moveContext } = (await req.json()) as {
      messages: { role: "user" | "assistant"; content: string }[];
      moveContext?: MoveContextInput;
    };

    if (!messages?.length) {
      return new Response("Messages required", { status: 400 });
    }

    const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

    const stream = await openai.chat.completions.create({
      model,
      stream: true,
      temperature: 0.4,
      max_tokens: 400,
      messages: [
        { role: "system", content: buildMoveSystemPrompt(moveContext) },
        ...messages.slice(-6).map((m) => ({
          role: m.role,
          content: m.content,
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
    console.error("Chat API error:", error);
    return new Response("Failed to generate response", { status: 500 });
  }
}
