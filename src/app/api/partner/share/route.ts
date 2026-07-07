import { NextRequest, NextResponse } from "next/server";
import { jsonErrorFromRequest } from "@/lib/api-errors";
import { requireCanEditData, requireMoveAccess } from "@/lib/api-auth";
import { requireProSubscription } from "@/lib/billing/require-pro";
import { mergeProfileForSync } from "@/lib/db/move-service";
import { listActivePartnersForRoute } from "@/lib/partner/partner-store";
import { lowestQuoteAmount } from "@/lib/partner/quote-utils";
import { resolveMoveBriefForPartner, serializeQuote } from "@/lib/partner/resolve-brief";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const proCheck = await requireProSubscription(req);
  if (proCheck instanceof NextResponse) return proCheck;
  const result = await requireMoveAccess(req);
  if (result instanceof NextResponse) return result;

  const [move, user, dbMove] = await Promise.all([
    prisma.move.findUnique({
      where: { id: result.access.moveId },
      select: {
        partnerShareEnabled: true,
        partnerShareToken: true,
        origin: true,
        destination: true,
        moveDate: true,
        household: true,
        selectedRouteIndex: true,
      },
    }),
    prisma.user.findUniqueOrThrow({ where: { id: result.user.id } }),
    prisma.move.findUniqueOrThrow({ where: { id: result.access.moveId } }),
  ]);
  if (!move) return jsonErrorFromRequest(req, "noMove", 404);

  const quotes = await prisma.partnerQuote.findMany({
    where: { moveId: result.access.moveId },
    orderBy: { createdAt: "desc" },
  });

  const profile = mergeProfileForSync(user, dbMove);
  const brief = await resolveMoveBriefForPartner(
    result.access.moveId,
    profile,
    move.selectedRouteIndex ?? 0
  );

  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const shareUrl = move.partnerShareToken
    ? `${base}/quote/${move.partnerShareToken}`
    : null;

  const serializedQuotes = quotes.map(serializeQuote);
  const lowestQuote = lowestQuoteAmount(serializedQuotes);

  return NextResponse.json({
    enabled: move.partnerShareEnabled,
    shareUrl,
    shareToken: move.partnerShareToken,
    quotes: serializedQuotes,
    brief,
    diyEstimate: brief.diyEstimate ?? brief.budgetEstimate,
    lowestQuote,
    directory: await listActivePartnersForRoute(move.origin, move.destination),
    moveSummary: {
      origin: move.origin,
      destination: move.destination,
      moveDate: move.moveDate.toISOString().slice(0, 10),
      household: move.household,
    },
  });
}

export async function POST(req: NextRequest) {
  const proCheck = await requireProSubscription(req);
  if (proCheck instanceof NextResponse) return proCheck;
  const result = await requireMoveAccess(req);
  if (result instanceof NextResponse) return result;

  const denied = requireCanEditData(result.access);
  if (denied) return denied;
  if (result.access.role !== "owner") {
    return jsonErrorFromRequest(req, "ownerOnly", 403);
  }

  const { enabled } = (await req.json()) as { enabled?: boolean };

  if (enabled === false) {
    await prisma.move.update({
      where: { id: result.access.moveId },
      data: { partnerShareEnabled: false },
    });
    return NextResponse.json({ enabled: false, shareUrl: null });
  }

  const existing = await prisma.move.findUnique({
    where: { id: result.access.moveId },
    select: { partnerShareToken: true },
  });
  const { randomUUID } = await import("crypto");
  const token = existing?.partnerShareToken ?? randomUUID().replace(/-/g, "").slice(0, 24);

  await prisma.move.update({
    where: { id: result.access.moveId },
    data: { partnerShareEnabled: true, partnerShareToken: token },
  });

  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return NextResponse.json({
    enabled: true,
    shareUrl: `${base}/quote/${token}`,
  });
}
