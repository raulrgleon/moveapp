const fs = require("fs");
const path = require("path");

function loadEnvFile(filename) {
  const filePath = path.join(__dirname, filename);
  if (!fs.existsSync(filePath)) return {};
  const env = {};
  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

const baseEnv = loadEnvFile(".env");
const localEnv = loadEnvFile(".env.local");

function mergeEnv(...sources) {
  const merged = {};
  for (const source of sources) {
    for (const [key, value] of Object.entries(source)) {
      if (value !== undefined && value !== "") merged[key] = value;
    }
  }
  return merged;
}

const appEnv = mergeEnv(baseEnv, localEnv);

module.exports = {
  apps: [
    {
      name: "moveapp",
      cwd: "/var/www/moveapp",
      script: "npm",
      args: "start",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        ...appEnv,
      },
      max_restarts: 10,
      min_uptime: "10s",
      exp_backoff_restart_delay: 1000,
    },
  ],
};
