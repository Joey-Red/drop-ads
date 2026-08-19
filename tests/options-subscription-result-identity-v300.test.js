import test from "node:test";
import assert from "node:assert/strict";
import { unwrapOptionsSubscriptionResponse } from "../src/core/options-boundary.js";
import { MAX_SUBSCRIPTION_ID_CHARS, MAX_SUBSCRIPTION_TITLE_CHARS } from "../src/core/subscriptions.js";

function response(subscription) {
  return { ok: true, subscription };
}

test("Settings subscription result accepts canonical identity boundaries", () => {
  const id = `a${"b".repeat(MAX_SUBSCRIPTION_ID_CHARS - 1)}`;
  const title = "T".repeat(MAX_SUBSCRIPTION_TITLE_CHARS);
  assert.deepEqual(
    unwrapOptionsSubscriptionResponse(response({ id, title, enabled: true, source: "fetched" }), "fallback"),
    { id, title, enabled: true, source: "fetched" }
  );
});

test("Settings subscription result rejects invalid or oversized ids", () => {
  assert.throws(() => unwrapOptionsSubscriptionResponse(response({ id: "", title: "x" }), "fallback"), /id is invalid/);
  assert.throws(() => unwrapOptionsSubscriptionResponse(response({ id: `a${"b".repeat(MAX_SUBSCRIPTION_ID_CHARS)}`, title: "x" }), "fallback"), /id is invalid/);
  assert.throws(() => unwrapOptionsSubscriptionResponse(response({ id: "bad id", title: "x" }), "fallback"), /id is invalid/);
  assert.throws(() => unwrapOptionsSubscriptionResponse(response({ id: "?bad", title: "x" }), "fallback"), /id is invalid/);
});

test("Settings subscription result requires a meaningful bounded title when present", () => {
  assert.throws(() => unwrapOptionsSubscriptionResponse(response({ id: "external-1", title: "" }), "fallback"), /title is invalid/);
  assert.throws(() => unwrapOptionsSubscriptionResponse(response({ id: "external-1", title: "   " }), "fallback"), /title is invalid/);
  assert.throws(() => unwrapOptionsSubscriptionResponse(response({ id: "external-1", title: "x".repeat(MAX_SUBSCRIPTION_TITLE_CHARS + 1) }), "fallback"), /title is invalid/);
});
