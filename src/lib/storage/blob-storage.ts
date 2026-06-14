import { mkdir, writeFile, readFile, unlink } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

export type BlobCategory = "inventory" | "documents";

const LOCAL_ROOTS: Record<BlobCategory, string> = {
  inventory:
    process.env.UPLOAD_DIR_INVENTORY || path.join(process.cwd(), "uploads", "inventory"),
  documents: process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads", "documents"),
};

/** Set S3_BUCKET + AWS credentials to enable cloud storage (requires @aws-sdk/client-s3 in a future release). */
export function getStorageBackend(): "s3" | "local" {
  return process.env.S3_BUCKET ? "s3" : "local";
}

function sanitizeKey(storageKey: string, category: BlobCategory): string {
  const root = LOCAL_ROOTS[category];
  const normalized = path.normalize(storageKey).replace(/^(\.\.[/\\])+/, "");
  const fullPath = path.join(root, normalized);
  if (!fullPath.startsWith(root)) {
    throw new Error("Invalid storage key");
  }
  return normalized;
}

export async function saveBlob(
  category: BlobCategory,
  moveId: string,
  fileName: string,
  buffer: Buffer,
  _contentType: string
) {
  if (getStorageBackend() === "s3") {
    console.warn("S3 configured but using local fallback until SDK is wired");
  }

  const ext = path.extname(fileName) || "";
  const storageKey = `${moveId}/${randomUUID()}${ext}`;
  const normalized = sanitizeKey(storageKey, category);
  const fullPath = path.join(LOCAL_ROOTS[category], normalized);
  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, buffer);
  return { storageKey: normalized, sizeBytes: buffer.length, backend: "local" as const };
}

export async function readBlob(category: BlobCategory, storageKey: string): Promise<Buffer> {
  const normalized = sanitizeKey(storageKey, category);
  return readFile(path.join(LOCAL_ROOTS[category], normalized));
}

export async function deleteBlob(category: BlobCategory, storageKey: string) {
  try {
    const normalized = sanitizeKey(storageKey, category);
    await unlink(path.join(LOCAL_ROOTS[category], normalized));
  } catch {
    /* already gone */
  }
}

export function resolveLocalPath(category: BlobCategory, storageKey: string) {
  return path.join(LOCAL_ROOTS[category], sanitizeKey(storageKey, category));
}
