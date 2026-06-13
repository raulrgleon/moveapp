import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { requireMoveAccess } from "@/lib/api-auth";
import { getMoveForUser } from "@/lib/db/move-access";
import { buildLanguageInstruction, resolveReplyLocale } from "@/lib/ai/detect-message-locale";
import type { Locale } from "@/lib/i18n";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  const result = await requireMoveAccess(req);
  if (result instanceof NextResponse) return result;

  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({ error: "OpenAI not configured" }, { status: 500 });
  }

  const { question, locale } = (await req.json()) as {
    question?: string;
    locale?: Locale;
  };

  if (!question?.trim()) {
    return NextResponse.json({ error: "Question required" }, { status: 400 });
  }

  const moveData = await getMoveForUser(result.user.id);
  if (!moveData) {
    return NextResponse.json({ error: "Move not found" }, { status: 404 });
  }

  const boxes = moveData.move.inventoryBoxes;
  const fallback: Locale = locale === "es" ? "es" : "en";
  const replyLocale = resolveReplyLocale(question.trim(), fallback);
  const languageBlock = buildLanguageInstruction(replyLocale);
  const inventoryLines =
    boxes.length === 0
      ? "No boxes yet."
      : boxes
          .map((b) => {
            const dest = b.destinationRoom ?? b.room;
            const weight =
              b.weightLbs ??
              (b.sizeEstimate === "s" ? 25 : b.sizeEstimate === "l" ? 70 : 45);
            return `#${b.boxNumber} ${b.room} → ${dest}, ${b.status}, fragile=${b.fragile}, essentials=${b.essentials ?? false}, ~${Math.round(weight)}lb: ${b.contents}`;
          })
          .join("\n");

  try {
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      temperature: 0.4,
      max_tokens: 400,
      messages: [
        {
          role: "system",
          content: `You are Pilot, MovePilotAi's moving assistant. Help with box inventory, packing order, fragile items, and move day unloading. Be concise and practical. Use bullet lists when helpful.\n\n${languageBlock}`,
        },
        {
          role: "user",
          content: `Move: ${moveData.move.origin} → ${moveData.move.destination}\nMove date: ${moveData.move.moveDate.toISOString().slice(0, 10)}\n\nINVENTORY (${boxes.length} boxes):\n${inventoryLines}\n\nQuestion: ${question.trim()}`,
        },
      ],
    });

    return NextResponse.json({
      answer: completion.choices[0]?.message?.content?.trim() ?? "",
    });
  } catch (error) {
    console.error("POST /api/inventory/assist error:", error);
    return NextResponse.json({ error: "Failed to get answer" }, { status: 500 });
  }
}
