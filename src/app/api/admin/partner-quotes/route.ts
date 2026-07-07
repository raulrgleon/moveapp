import { NextRequest, NextResponse } from "next/server";
import { forbidden, requireAdmin } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return forbidden(req);

  const quotes = await prisma.partnerQuote.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: {
      move: {
        select: {
          id: true,
          origin: true,
          destination: true,
          moveDate: true,
          user: { select: { name: true, email: true } },
        },
      },
    },
  });

  return NextResponse.json({
    quotes: quotes.map((q) => ({
      id: q.id,
      companyName: q.companyName,
      contactEmail: q.contactEmail,
      contactPhone: q.contactPhone,
      amount: q.amount,
      amountMin: q.amountMin,
      amountMax: q.amountMax,
      status: q.status,
      serviceType: q.serviceType,
      usdotNumber: q.usdotNumber,
      createdAt: q.createdAt.toISOString(),
      move: {
        id: q.move.id,
        origin: q.move.origin,
        destination: q.move.destination,
        moveDate: q.move.moveDate.toISOString().slice(0, 10),
        ownerName: q.move.user.name,
        ownerEmail: q.move.user.email,
      },
    })),
  });
}
