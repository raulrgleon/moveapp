/** Read env at runtime (avoids Next.js build-time inlining of process.env.VAR). */
export function runtimeEnv(name: string): string | undefined {
  const value = process.env[name];
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed || undefined;
}
