#!/usr/bin/env node
/**
 * Configure Namecheap DNS for Resend domain verification (movepilotai.com).
 * Requires NAMECHEAP_* in .env / .env.local and Resend DNS values (API or env).
 *
 * Usage: node scripts/setup-resend-dns.mjs [--dry-run] [--verify-resend]
 */
import fs from "fs";
import path from "path";

const ROOT = path.join("/var/www/moveapp");
const DOMAIN = "movepilotai.com";
const [SLD, TLD] = DOMAIN.split(".");

function loadEnvFiles() {
  const merged = {};
  for (const file of [".env", ".env.local"]) {
    const filePath = path.join(ROOT, file);
    if (!fs.existsSync(filePath)) continue;
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
      merged[key] = value;
    }
  }
  return merged;
}

function parseXmlTag(xml, tag) {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = xml.match(re);
  if (m) return m[1].trim();
  const attr = xml.match(new RegExp(`${tag}="([^"]*)"`, "i"));
  return attr ? attr[1].trim() : null;
}

function parseHosts(xml) {
  const hosts = [];
  const blocks = xml.match(/<host[^>]*\/>|<host[^>]*>[\s\S]*?<\/host>/gi) ?? [];
  for (const block of blocks) {
    hosts.push({
      name: parseXmlTag(block, "Name") ?? "@",
      type: parseXmlTag(block, "Type") ?? "A",
      address: parseXmlTag(block, "Address") ?? "",
      mxPref: parseXmlTag(block, "MXPref") ?? "10",
      ttl: parseXmlTag(block, "TTL") ?? "1800",
    });
  }
  return hosts;
}

async function namecheapRequest(env, command, extra = {}) {
  const apiUser = env.NAMECHEAP_API_USER?.trim();
  const apiKey = env.NAMECHEAP_API_KEY?.trim();
  const userName = env.NAMECHEAP_USERNAME?.trim() || apiUser;
  const clientIp = env.NAMECHEAP_CLIENT_IP?.trim();
  if (!apiUser || !apiKey || !clientIp) {
    throw new Error(
      "Missing NAMECHEAP_API_USER, NAMECHEAP_API_KEY, or NAMECHEAP_CLIENT_IP in .env"
    );
  }

  const params = new URLSearchParams({
    ApiUser: apiUser,
    ApiKey: apiKey,
    UserName: userName,
    ClientIp: clientIp,
    Command: command,
    ...extra,
  });

  const base =
    env.NAMECHEAP_API_SANDBOX === "true"
      ? "https://api.sandbox.namecheap.com/xml.response"
      : "https://api.namecheap.com/xml.response";

  const url = `${base}?${params.toString()}`;
  const res = await fetch(url);
  const xml = await res.text();

  const status = xml.match(/Status="([^"]+)"/)?.[1];
  if (status?.toUpperCase() !== "OK") {
    const err = parseXmlTag(xml, "Error") ?? xml.slice(0, 500);
    throw new Error(`Namecheap ${command} failed: ${err}`);
  }
  return xml;
}

async function fetchResendRecords(env) {
  const manual = {
    dkim: env.RESEND_DKIM_VALUE?.trim(),
    spfSend: env.RESEND_SPF_SEND?.trim() || "v=spf1 include:amazonses.com ~all",
    mxSend: env.RESEND_MX_SEND?.trim() || "feedback-smtp.us-east-1.amazonses.com",
    mxPriority: Number(env.RESEND_MX_PRIORITY ?? "10"),
  };

  const apiKey = env.RESEND_API_KEY?.trim();
  const domainId = env.RESEND_DOMAIN_ID?.trim();

  if (apiKey && domainId) {
    const res = await fetch(`https://api.resend.com/domains/${domainId}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const body = await res.json();
    if (res.ok && body.records) {
      const records = body.records.map((r) => ({
        record: r.record,
        name: r.name,
        type: r.type,
        value: String(r.value ?? "").replace(/^"|"$/g, ""),
        priority: r.priority ?? 10,
      }));
      return { records, domainId: body.id, domainStatus: body.status };
    }
    if (body?.name === "restricted_api_key") {
      console.warn("Resend key is send-only; using RESEND_DKIM_VALUE from env if set.");
    } else if (!res.ok) {
      console.warn("Resend domain fetch failed:", body?.message ?? res.status);
    }
  }

  if (!manual.dkim) {
    throw new Error(
      "Need RESEND_DOMAIN_ID + full RESEND_API_KEY, or set RESEND_DKIM_VALUE in .env"
    );
  }

  return {
    records: [
      { record: "DKIM", name: "resend._domainkey", type: "TXT", value: manual.dkim },
      { record: "SPF", name: "send", type: "TXT", value: manual.spfSend },
      {
        record: "SPF",
        name: "send",
        type: "MX",
        value: manual.mxSend,
        priority: manual.mxPriority,
      },
    ],
    domainId: domainId ?? null,
    domainStatus: null,
  };
}

function hostKey(h) {
  return `${h.name}|${h.type}|${h.address}`;
}

function mergeHosts(existing, resendRecords) {
  const wanted = [...existing];
  const keys = new Set(wanted.map(hostKey));

  for (const r of resendRecords) {
    const address = r.type === "MX" ? r.value : r.value;
    const entry = {
      name: r.name,
      type: r.type,
      address,
      mxPref: String(r.priority ?? 10),
      ttl: "1800",
    };
    const key = hostKey(entry);
    if (keys.has(key)) continue;
    wanted.push(entry);
    keys.add(key);
  }

  // Ensure root SPF includes Private Email (keep existing if present)
  const rootSpfIdx = wanted.findIndex(
    (h) => h.name === "@" && h.type === "TXT" && h.address.startsWith("v=spf1")
  );
  const spfWithBoth =
    "v=spf1 include:spf.privateemail.com include:amazonses.com ~all";
  if (rootSpfIdx >= 0) {
    if (!wanted[rootSpfIdx].address.includes("amazonses.com")) {
      wanted[rootSpfIdx] = { ...wanted[rootSpfIdx], address: spfWithBoth };
    }
  } else {
    wanted.push({
      name: "@",
      type: "TXT",
      address: spfWithBoth,
      mxPref: "10",
      ttl: "1800",
    });
  }

  return wanted;
}

async function setHosts(env, hosts) {
  const params = { SLD, TLD };
  hosts.forEach((h, i) => {
    const n = i + 1;
    params[`HostName${n}`] = h.name;
    params[`RecordType${n}`] = h.type;
    let address = h.address;
    if (h.type === "MX" && !address.endsWith(".")) address += ".";
    params[`Address${n}`] = address;
    params[`TTL${n}`] = h.ttl || "1800";
    if (h.type === "MX") params[`MXPref${n}`] = h.mxPref || "10";
  });
  return namecheapRequest(env, "namecheap.domains.dns.setHosts", params);
}

async function verifyResendDomain(env, domainId) {
  if (!domainId || !env.RESEND_API_KEY) return null;
  const res = await fetch(`https://api.resend.com/domains/${domainId}/verify`, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}` },
  });
  return res.json();
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const verifyResend = process.argv.includes("--verify-resend");
  const env = loadEnvFiles();

  console.log("Fetching Resend DNS records...");
  const { records, domainId, domainStatus } = await fetchResendRecords(env);
  console.log("Resend records to ensure:");
  for (const r of records) {
    console.log(`  ${r.type} ${r.name} -> ${r.value.slice(0, 60)}${r.value.length > 60 ? "..." : ""}`);
  }

  console.log("\nFetching current Namecheap DNS...");
  const xml = await namecheapRequest(env, "namecheap.domains.dns.getHosts", { SLD, TLD });
  const existing = parseHosts(xml);
  console.log(`  ${existing.length} existing host records`);

  const merged = mergeHosts(existing, records);
  const added = merged.length - existing.length;
  console.log(`\nMerged total: ${merged.length} records (${added} new)`);

  if (dryRun) {
    console.log("\n[DRY RUN] Would set these records:");
    merged.forEach((h) =>
      console.log(`  ${h.type.padEnd(4)} ${h.name.padEnd(22)} ${h.address.slice(0, 70)}`)
    );
    return;
  }

  console.log("\nUpdating Namecheap DNS...");
  await setHosts(env, merged);
  console.log("Namecheap DNS updated.");

  if (verifyResend && domainId) {
    console.log("\nTriggering Resend verification...");
    const result = await verifyResendDomain(env, domainId);
    console.log(JSON.stringify(result, null, 2));
  } else if (domainStatus) {
    console.log(`\nResend domain status (before verify): ${domainStatus}`);
  }

  console.log("\nDone. DNS may take 15–60 min to propagate. Then verify in Resend dashboard.");
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
