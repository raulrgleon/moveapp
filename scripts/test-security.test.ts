import test from "node:test";
import assert from "node:assert/strict";
import { mutationOriginAllowed } from "../src/lib/security/origin.ts";
const origin = "https://movepilot.dnet.llc";
test("browser writes require the exact configured origin", () => {
  assert(mutationOriginAllowed("POST", "/api/move", origin, [origin]));
  for (const input of [null, "https://evil.example", origin + ".evil.example", origin + "/path", "null", "http://movepilot.dnet.llc"])
    assert.equal(mutationOriginAllowed("POST", "/api/move", input, [origin]), false);
});
test("health and reads remain available; anonymous writes do not bypass origin checks", () => {
  assert(mutationOriginAllowed("GET", "/api/health", null, [origin]));
  assert.equal(mutationOriginAllowed("POST", "/api/auth/login", null, [origin]), false);
  assert.equal(mutationOriginAllowed("DELETE", "/api/user/delete-account", null, [origin]), false);
});
test("only the existing signed/Bearer provider hooks are exempt", () => {
  assert(mutationOriginAllowed("POST", "/api/billing/webhook", null, [origin]));
  assert(mutationOriginAllowed("POST", "/api/cron/reminders", null, [origin]));
  assert.equal(mutationOriginAllowed("POST", "/api/cron/reminders/other", null, [origin]), false);
  assert(mutationOriginAllowed("POST", "/api/auth/apple/callback", "https://appleid.apple.com", [origin]));
  assert.equal(mutationOriginAllowed("POST", "/api/auth/apple/callback", "https://evil.example", [origin]), false);
});
