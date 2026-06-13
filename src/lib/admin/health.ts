import { execSync } from "child_process";
import { statfsSync } from "fs";
import path from "path";
import { getNotificationConfigStatus } from "@/lib/notifications/config";
import { prisma } from "@/lib/prisma";

function envConfigured(key: string) {
  const value = process.env[key];
  return Boolean(value && value.trim().length > 0);
}

function maskEnv(key: string) {
  const value = process.env[key];
  if (!value) return { configured: false, preview: null };
  const preview = value.length <= 8 ? "••••" : `${value.slice(0, 4)}…${value.slice(-4)}`;
  return { configured: true, preview };
}

export async function getSystemHealth() {
  let dbOk = false;
  let dbLatencyMs = 0;
  try {
    const start = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    dbLatencyMs = Date.now() - start;
    dbOk = true;
  } catch {
    dbOk = false;
  }

  let pm2Status: { online: boolean; uptime?: string; restarts?: number } = { online: false };
  try {
    const raw = execSync("pm2 jlist 2>/dev/null || echo '[]'", { encoding: "utf8" });
    const list = JSON.parse(raw) as { name?: string; pm2_env?: { status?: string; pm_uptime?: number; restart_time?: number } }[];
    const app = list.find((p) => p.name === "moveapp");
    if (app?.pm2_env?.status === "online") {
      pm2Status = {
        online: true,
        uptime: app.pm2_env.pm_uptime
          ? new Date(app.pm2_env.pm_uptime).toISOString()
          : undefined,
        restarts: app.pm2_env.restart_time,
      };
    }
  } catch {
    pm2Status = { online: false };
  }

  let diskFreeGb: number | null = null;
  try {
    const uploadRoot = process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");
    const stats = statfsSync(uploadRoot);
    diskFreeGb = Math.round((stats.bfree * stats.bsize) / 1024 / 1024 / 1024);
  } catch {
    diskFreeGb = null;
  }

  const integrations = {
    openai: envConfigured("OPENAI_API_KEY"),
    weather: envConfigured("WEATHERAPI_KEY"),
    rentcast: envConfigured("RENTCAST_API_KEY"),
    resend: envConfigured("RESEND_API_KEY"),
    googleOAuth: envConfigured("GOOGLE_CLIENT_ID") && envConfigured("GOOGLE_CLIENT_SECRET"),
    twilio: envConfigured("TWILIO_ACCOUNT_SID") && envConfigured("TWILIO_AUTH_TOKEN"),
    cron: envConfigured("CRON_SECRET"),
  };

  const notifications = getNotificationConfigStatus();

  return {
    dbOk,
    dbLatencyMs,
    pm2Status,
    diskFreeGb,
    appUrl: process.env.NEXT_PUBLIC_APP_URL ?? null,
    nodeEnv: process.env.NODE_ENV ?? "development",
    integrations,
    notifications,
    env: {
      authSecret: maskEnv("AUTH_SECRET"),
      databaseUrl: maskEnv("DATABASE_URL"),
      resend: maskEnv("RESEND_API_KEY"),
      googleClientId: maskEnv("GOOGLE_CLIENT_ID"),
    },
  };
}
