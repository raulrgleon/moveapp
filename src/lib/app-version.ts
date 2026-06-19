import { readFileSync } from "fs";
import path from "path";

const BUILD_ID_FILE = path.join(process.cwd(), ".next/BUILD_ID");

/** Server-side build id (changes on every production build). */
export function getServerBuildId(): string {
  try {
    return readFileSync(BUILD_ID_FILE, "utf8").trim();
  } catch {
    return process.env.NEXT_PUBLIC_BUILD_ID ?? "dev";
  }
}
