import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type RouteContext = { params: { token: string } };

export async function GET(_req: NextRequest, { params }: RouteContext) {
  const move = await prisma.move.findFirst({
    where: {
      partnerShareToken: params.token,
      partnerShareEnabled: true,
    },
    include: {
      inventoryBoxes: { select: { id: true, weightLbs: true, sizeEstimate: true } },
      checklistTasks: {
        where: { status: { not: "completed" } },
        select: { id: true },
      },
      budgetItems: { select: { estimated: true } },
    },
  });

  if (!move) {
    return NextResponse.json({ error: "Invalid or disabled link" }, { status: 404 });
  }

  const boxCount = move.inventoryBoxes.length;
  const estWeight = move.inventoryBoxes.reduce((sum, b) => {
    const w =
      b.weightLbs ??
      (b.sizeEstimate === "s" ? 25 : b.sizeEstimate === "l" ? 70 : 45);
    return sum + w;
  }, 0);

  const budgetEst = move.budgetItems.reduce((s, i) => s + i.estimated, 0);

  return NextResponse.json({
    origin: move.origin,
    destination: move.destination,
    moveDate: move.moveDate.toISOString().slice(0, 10),
    household: move.household,
    rentalPreference: move.rentalPreference,
    boxCount,
    estWeightLbs: Math.round(estWeight),
    pendingTasks: move.checklistTasks.length,
    budgetEstimate: budgetEst || move.budget,
    pets: move.pets,
  });
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  const move = await prisma.move.findFirst({
    where: {
      partnerShareToken: params.token,
      partnerShareEnabled: true,
    },
  });

  if (!move) {
    return NextResponse.json({ error: "Invalid or disabled link" }, { status: 404 });
  }

  const body = (await req.json()) as {
    companyName?: string;
    contactEmail?: string;
    contactPhone?: string;
    amount?: number;
    message?: string;
  };

  const companyName = body.companyName?.trim();
  const contactEmail = body.contactEmail?.trim().toLowerCase();

  if (!companyName || !contactEmail?.includes("@")) {
    return NextResponse.json({ error: "Company name and valid email required" }, { status: 400 });
  }

  const quote = await prisma.partnerQuote.create({
    data: {
      moveId: move.id,
      companyName,
      contactEmail,
      contactPhone: body.contactPhone?.trim() || null,
      amount: body.amount != null ? Math.round(body.amount) : null,
      message: body.message?.trim() || null,
    },
  });

  return NextResponse.json({ ok: true, quoteId: quote.id }, { status: 201 });
}
