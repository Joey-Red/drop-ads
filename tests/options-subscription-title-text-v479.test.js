import test from "node:test";
import assert from "node:assert/strict";

import { unwrapOptionsSubscriptionResponse } from "../src/core/options-boundary.js";
import { isSubscriptionTitleTextSafe, normalizeSubscription } from "../src/core/subscriptions.js";

function reply(title) {
  return { ok: true, subscription: { id: "example-list", title } };
}

const unsafeTitles = [
  "bad\u0000title",
  "bad\ntitle",
  "bad\u007ftitle",
  "bad\u2028title",
  "bad\u2029title"
];

test("M479 Settings subscription results share the canonical title-text predicate", () => {
  for (const title of unsafeTitles) {
    assert.equal(isSubscriptionTitleTextSafe(title), false);
    assert.throws(
      () => unwrapOptionsSubscriptionResponse(reply(title), "fallback"),
      /subscription\.title is invalid/
    );
  }
});

test("M479 canonical subscription normalization uses the same title predicate", () => {
  for (const title of unsafeTitles) {
    assert.throws(() => normalizeSubscription({
      id: "example-list",
      title,
      format: "third-party",
      sourceUrl: "https://example.com/list.txt"
    }), /Subscription title is invalid/);
  }
});

test("M479 preserves ordinary Unicode and existing trimming behavior", () => {
  const title = "  Café blockers — 日本語  ";
  assert.equal(isSubscriptionTitleTextSafe(title), true);
  assert.equal(unwrapOptionsSubscriptionResponse(reply(title), "fallback").title, title);
  assert.equal(normalizeSubscription({
    id: "example-list",
    title,
    format: "third-party",
    sourceUrl: "https://example.com/list.txt"
  }).title, "Café blockers — 日本語");
});
