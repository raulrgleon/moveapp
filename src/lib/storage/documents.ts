import { mkdir, writeFile, readFile, unlink } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const UPLOAD_ROOT =
  process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads", "documents");

const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export function validateDocumentFile(file: File) {
  if (file.size > MAX_BYTES) {
    throw new Error("File must be under 10 MB");
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Unsupported file type");
  }
}

export async function saveDocumentFile(moveId: string, file: File) {
  validateDocumentFile(file);
  const ext = path.extname(file.name) || "";
  const storageKey = `${moveId}/${randomUUID()}${ext}`;
  const fullPath = path.join(UPLOAD_ROOT, storageKey);
  await mkdir(path.dirname(fullPath), { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(fullPath, buffer);
  return {
    storageKey,
    mimeType: file.type,
    sizeBytes: file.size,
    fileName: file.name,
  };
}

export function resolveDocumentPath(storageKey: string) {
  const normalized = path.normalize(storageKey).replace(/^(\.\.[/\\])+/, "");
  const fullPath = path.join(UPLOAD_ROOT, normalized);
  if (!fullPath.startsWith(UPLOAD_ROOT)) {
    throw new Error("Invalid storage key");
  }
  return fullPath;
}

export async function readDocumentFile(storageKey: string) {
  return readFile(resolveDocumentPath(storageKey));
}

export async function deleteDocumentFile(storageKey: string) {
  try {
    await unlink(resolveDocumentPath(storageKey));
  } catch {
    /* file may already be gone */
  }
}
