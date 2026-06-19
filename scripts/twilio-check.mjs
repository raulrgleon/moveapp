#!/usr/bin/env node
/**
 * Validates Twilio env vars and tests API credentials.
 * Usage: node scripts/twilio-check.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

function loadEnv(filename) {
  const filePath = path.join(root, filename);
  if (!fs.existsSync(filePath)) return {};
  const env = {};
  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
  return env;
}

const env = { ...loadEnv(".env"), ...loadEnv(".env.local") };

const accountSid = env.TWILIO_ACCOUNT_SID?.trim();
const phone = env.TWILIO_PHONE_NUMBER?.trim();
const authToken = env.TWILIO_AUTH_TOKEN?.trim();
const apiKeySid = env.TWILIO_API_KEY_SID?.trim();
const apiKeySecret = env.TWILIO_API_KEY_SECRET?.trim();

const missing = [];
if (!accountSid) missing.push("TWILIO_ACCOUNT_SID");
if (!phone) missing.push("TWILIO_PHONE_NUMBER");
if (!(authToken || (apiKeySid && apiKeySecret))) {
  missing.push("TWILIO_AUTH_TOKEN or TWILIO_API_KEY_SID + TWILIO_API_KEY_SECRET");
}

console.log("Twilio configuration check\n");

if (missing.length) {
  console.log("Missing:");
  for (const m of missing) console.log(`  - ${m}`);
  console.log("\nAdd these to .env.local, then: pm2 restart moveapp");
  process.exit(1);
}

const username = apiKeySid && apiKeySecret ? apiKeySid : accountSid;
const password = apiKeySid && apiKeySecret ? apiKeySecret : authToken;
const auth = Buffer.from(`${username}:${password}`).toString("base64");

console.log(`Account SID: ${accountSid}`);
console.log(`From number: ${phone}`);
console.log(`Auth method: ${apiKeySid ? "API Key" : "Auth Token"}`);

const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`, {
  headers: { Authorization: `Basic ${auth}` },
});
const body = await res.text();

if (!res.ok) {
  console.error(`\nTwilio API error (${res.status}):`, body);
  console.error("\nIf using an API Key, confirm TWILIO_ACCOUNT_SID matches the key's account.");
  console.error("Or use TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN from the Twilio dashboard.");
  process.exit(1);
}

console.log("\nTwilio credentials OK.");

const numbersRes = await fetch(
  `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/IncomingPhoneNumbers.json?PageSize=5`,
  { headers: { Authorization: `Basic ${auth}` } }
);
if (numbersRes.ok) {
  const data = JSON.parse(await numbersRes.text());
  const nums = data.incoming_phone_numbers ?? [];
  if (nums.length) {
    console.log("\nPhone numbers on account:");
    for (const n of nums) console.log(`  ${n.phone_number}`);
  }
}

console.log("\nRestart app: pm2 restart moveapp");
