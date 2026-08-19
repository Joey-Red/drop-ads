import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/runtime.js", import.meta.url), "utf8");

test("M427 direct external subscriptions are detached before normalization or side effects", () => {
  assert.match(source, /const EXTERNAL_SUBSCRIPTION_KEYS = new Set\(\["id", "title", "format", "sourceUrl", "enabled"\]\)/);
  assert.match(source, /function externalSubscriptionSnapshot\(subscription\) \{[\s\S]*assertPlainExactObject\(subscription, "External subscription", EXTERNAL_SUBSCRIPTION_KEYS\);[\s\S]*readPlainDataField\(subscription, key\)/);
  assert.match(source, /async function addExternalSubscription\(subscription\) \{\s*const sourceRecord = externalSubscriptionSnapshot\(subscription\);\s*const candidate = normalizeSubscription\(\{ \.\.\.sourceRecord, builtIn: false \}\);/s);
  assert.doesNotMatch(source, /normalizeSubscription\(\{ \.\.\.subscription, builtIn: false \}\)/);
});

test("M427 caller-supplied builtIn and unknown fields are outside the direct admission schema", () => {
  assert.doesNotMatch(source, /EXTERNAL_SUBSCRIPTION_KEYS[^\n]*builtIn/);
  assert.match(source, /REQUIRED_EXTERNAL_SUBSCRIPTION_KEYS = \["id", "title", "format", "sourceUrl"\]/);
});
