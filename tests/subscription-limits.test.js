import test from "node:test";
import assert from "node:assert/strict";
import {
  BUILT_IN_SUBSCRIPTIONS,
  MAX_SUBSCRIPTION_ID_CHARS,
  MAX_SUBSCRIPTION_SOURCE_URL_CHARS,
  MAX_SUBSCRIPTION_SOURCE_URL_INPUT_CHARS,
  MAX_SUBSCRIPTION_TITLE_CHARS,
  normalizeSubscription
} from "../src/core/subscriptions.js";

function candidate(sourceUrl, overrides = {}) {
  return {
    id: "external-limit",
    title: "Limit test",
    format: "hosts",
    sourceUrl,
    enabled: true,
    ...overrides
  };
}

test("subscription string ceilings are explicit and built-ins remain within them", () => {
  assert.equal(MAX_SUBSCRIPTION_ID_CHARS, 96);
  assert.equal(MAX_SUBSCRIPTION_TITLE_CHARS, 120);
  assert.equal(MAX_SUBSCRIPTION_SOURCE_URL_INPUT_CHARS, 4096);
  assert.equal(MAX_SUBSCRIPTION_SOURCE_URL_CHARS, 4000);
  for (const builtIn of BUILT_IN_SUBSCRIPTIONS) assert.doesNotThrow(() => normalizeSubscription(builtIn));
});

test("canonical source URL accepts the exact stored ceiling and rejects one over", () => {
  const prefix = "https://example.com/";
  const exact = prefix + "a".repeat(MAX_SUBSCRIPTION_SOURCE_URL_CHARS - prefix.length);
  assert.equal(normalizeSubscription(candidate(exact)).sourceUrl.length, MAX_SUBSCRIPTION_SOURCE_URL_CHARS);

  const over = prefix + "a".repeat(MAX_SUBSCRIPTION_SOURCE_URL_CHARS + 1 - prefix.length);
  assert.throws(() => normalizeSubscription(candidate(over)), /canonical characters/);
});

test("raw source URL is rejected before URL parsing when input ceiling is exceeded", () => {
  const raw = "x".repeat(MAX_SUBSCRIPTION_SOURCE_URL_INPUT_CHARS + 1);
  assert.throws(() => normalizeSubscription(candidate(raw)), /before normalization/);
});

test("canonical URL expansion is bounded even when raw Unicode input is short", () => {
  const raw = `https://example.com/${"é".repeat(1_000)}`;
  assert.ok(raw.length < MAX_SUBSCRIPTION_SOURCE_URL_INPUT_CHARS);
  assert.throws(() => normalizeSubscription(candidate(raw)), /canonical characters/);
});

test("ordinary query-bearing sources remain supported while giant queries are bounded", () => {
  const normal = normalizeSubscription(candidate("https://lists.example.com/hosts.txt?channel=stable&key=opaque#ignored"));
  assert.equal(normal.sourceUrl, "https://lists.example.com/hosts.txt?channel=stable&key=opaque");

  const prefix = "https://lists.example.com/hosts.txt?q=";
  const giant = prefix + "a".repeat(MAX_SUBSCRIPTION_SOURCE_URL_CHARS + 1 - prefix.length);
  assert.throws(() => normalizeSubscription(candidate(giant)), /canonical characters/);
});

test("id and title ceilings remain enforced through the shared normalizer", () => {
  assert.doesNotThrow(() => normalizeSubscription(candidate("https://example.com/list", {
    id: `x${"a".repeat(MAX_SUBSCRIPTION_ID_CHARS - 1)}`,
    title: "T".repeat(MAX_SUBSCRIPTION_TITLE_CHARS)
  })));
  assert.throws(() => normalizeSubscription(candidate("https://example.com/list", {
    id: `x${"a".repeat(MAX_SUBSCRIPTION_ID_CHARS)}`
  })), /id is invalid/);
  assert.throws(() => normalizeSubscription(candidate("https://example.com/list", {
    title: "T".repeat(MAX_SUBSCRIPTION_TITLE_CHARS + 1)
  })), /title is invalid/);
});
