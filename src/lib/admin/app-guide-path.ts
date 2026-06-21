import path from "path";

export const APP_GUIDE_FILENAME = "app-guide.generated.md";

export function getAppGuideFilePath(): string {
  return path.join(process.cwd(), "data", APP_GUIDE_FILENAME);
}
