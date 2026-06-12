import { mkdir, writeFile, readFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const UPLOAD_ROOT =
  process.env.UPLOAD_DIR_INVENTORY ||
  path.join(process.cwd(), "uploads", "inventory");

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export function validateInventoryPhoto(file: File) {
  if (file.size > MAX_BYTES) {
    throw new Error("Photo must be under 5 MB");
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new Error("Unsupported image type");
  }
}

export async function saveInventoryPhoto(moveId: string, file: File) {
  validateInventoryPhoto(file);
  const ext = path.extname(file.name) || ".jpg";
  const storageKey = `${moveId}/${randomUUID()}${ext}`;
  const fullPath = path.join(UPLOAD_ROOT, storageKey);
  await mkdir(path.dirname(fullPath), { recursive: true });
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(fullPath, buffer);
  return {
    storageKey,
    mimeType: file.type,
    sizeBytes: file.size,
    photoUrl: `/api/inventory/photo/${storageKey.replace(/\\/g, "/")}`,
  };
}

export async function saveInventoryPhotoFromBase64(
  moveId: string,
  dataUrl: string
) {
  const match = dataUrl.match(/^data:(image\/[a-z+]+);base64,(.+)$/i);
  if (!match) throw new Error("Invalid image data");
  const mimeType = match[1];
  if (!ALLOWED_TYPES.has(mimeType)) throw new Error("Unsupported image type");
  const buffer = Buffer.from(match[2], "base64");
  if (buffer.length > MAX_BYTES) throw new Error("Photo must be under 5 MB");
  const ext = mimeType === "image/png" ? ".png" : mimeType === "image/webp" ? ".webp" : ".jpg";
  const storageKey = `${moveId}/${randomUUID()}${ext}`;
  const fullPath = path.join(UPLOAD_ROOT, storageKey);
  await mkdir(path.dirname(fullPath), { recursive: true });
  await writeFile(fullPath, buffer);
  return {
    storageKey,
    mimeType,
    sizeBytes: buffer.length,
    photoUrl: `/api/inventory/photo/${storageKey.replace(/\\/g, "/")}`,
  };
}

export function resolveInventoryPhotoPath(storageKey: string) {
  const normalized = path.normalize(storageKey).replace(/^(\.\.[/\\])+/, "");
  const fullPath = path.join(UPLOAD_ROOT, normalized);
  if (!fullPath.startsWith(UPLOAD_ROOT)) {
    throw new Error("Invalid storage key");
  }
  return fullPath;
}

export async function readInventoryPhoto(storageKey: string) {
  return readFile(resolveInventoryPhotoPath(storageKey));
}
