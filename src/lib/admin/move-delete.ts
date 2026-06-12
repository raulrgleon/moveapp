import { rm } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { deleteDocumentFile } from "@/lib/storage/documents";

const UPLOAD_ROOT =
  process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads", "documents");

export async function deleteMoveByAdmin(moveId: string) {
  const move = await prisma.move.findUnique({
    where: { id: moveId },
    include: {
      documents: { select: { storageKey: true } },
      user: { select: { id: true, email: true, name: true } },
    },
  });

  if (!move) {
    throw new Error("Move not found");
  }

  for (const doc of move.documents) {
    if (doc.storageKey) {
      await deleteDocumentFile(doc.storageKey);
    }
  }

  try {
    await rm(path.join(UPLOAD_ROOT, moveId), { recursive: true, force: true });
  } catch {
    /* upload folder may not exist */
  }

  await prisma.user.updateMany({
    where: { activeMoveId: moveId },
    data: { activeMoveId: null },
  });

  await prisma.move.delete({ where: { id: moveId } });

  return {
    ownerId: move.userId,
    ownerEmail: move.user.email,
    origin: move.origin,
    destination: move.destination,
  };
}
