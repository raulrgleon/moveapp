import Stripe from "stripe";
import fs from "fs";
import path from "path";

const ENV_PATH = path.join("/var/www/moveapp", ".env.local");
const APP_URL = "https://movepilotai.com";
const WEBHOOK_URL = `${APP_URL}/api/billing/webhook`;

function readEnvFile() {
  if (!fs.existsSync(ENV_PATH)) return {};
  const text = fs.readFileSync(ENV_PATH, "utf8");
  const out = {};
  for (const line of text.split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

function upsertEnv(updates) {
  let lines = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, "utf8").split("\n") : [];
  for (const [key, value] of Object.entries(updates)) {
    const idx = lines.findIndex((l) => l.startsWith(`${key}=`));
    const row = `${key}=${value}`;
    if (idx >= 0) lines[idx] = row;
    else lines.push(row);
  }
  const body = lines.join("\n").replace(/\n+$/, "") + "\n";
  fs.writeFileSync(ENV_PATH, body);
}

async function main() {
  const env = readEnvFile();
  const secret = env.STRIPE_SECRET_KEY || process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    console.error("STRIPE_SECRET_KEY missing in .env.local");
    process.exit(1);
  }

  const stripe = new Stripe(secret);
  const updates = {};

  let priceId = env.STRIPE_PRO_PRICE_ID?.trim();
  if (!priceId) {
    const existing = await stripe.products.search({
      query: "name:'MovePilot Pro'",
      limit: 1,
    });
    let product = existing.data[0];
    if (!product) {
      product = await stripe.products.create({
        name: "MovePilot Pro",
        description: "Full MovePilotAi access for one move — route, budget, Pilot AI, and more.",
      });
      console.log("Created product:", product.id);
    }

    const prices = await stripe.prices.list({ product: product.id, active: true, limit: 10 });
    const match = prices.data.find((p) => p.unit_amount === 2900 && p.currency === "usd");
    if (match) {
      priceId = match.id;
      console.log("Using existing price:", priceId);
    } else {
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: 2900,
        currency: "usd",
        nickname: "Pro per move",
      });
      priceId = price.id;
      console.log("Created price:", priceId);
    }
    updates.STRIPE_PRO_PRICE_ID = priceId;
  } else {
    console.log("Price ID already set");
  }

  let webhookSecret = env.STRIPE_WEBHOOK_SECRET?.trim();
  if (!webhookSecret) {
    const endpoints = await stripe.webhookEndpoints.list({ limit: 100 });
    const sameUrl = endpoints.data.filter((e) => e.url === WEBHOOK_URL);
    for (const old of sameUrl) {
      await stripe.webhookEndpoints.del(old.id);
      console.log("Removed old webhook:", old.id);
    }

    const endpoint = await stripe.webhookEndpoints.create({
      url: WEBHOOK_URL,
      enabled_events: ["checkout.session.completed", "checkout.session.async_payment_succeeded"],
      description: "MovePilotAi Pro activation",
    });
    webhookSecret = endpoint.secret;
    console.log("Created webhook:", endpoint.id);
    updates.STRIPE_WEBHOOK_SECRET = webhookSecret;
  } else {
    console.log("Webhook secret already set");
  }

  if (Object.keys(updates).length > 0) {
    upsertEnv(updates);
    console.log("Updated .env.local:", Object.keys(updates).join(", "));
  } else {
    console.log("Nothing to update.");
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
