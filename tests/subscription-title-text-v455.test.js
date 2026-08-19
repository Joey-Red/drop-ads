import test from "node:test";
import assert from "node:assert/strict";

import {
  BLOCKLIST_PROJECT_ADS_SUBSCRIPTION,
  normalizeSubscription
} from "../src/core/subscriptions.js";

function candidate(title) {
  return {
    id: "example-list",
    title,
    format: "third-party",
    sourceUrl: "https://example.com/filter.txt",
    enabled: true,
    builtIn: false
  };
}

test("M455 keeps ordinary Unicode subscription titles", () => {
  assert.equal(normalizeSubscription(candidate("Privacy — Français 日本語")).title, "Privacy — Français 日本語");
  assert.equal(normalizeSubscription(BLOCKLIST_PROJECT_ADS_SUBSCRIPTION).title, "Block List Project — Ads");
});

test("M455 rejects control and line-separator characters in subscription titles", () => {
  for (const marker of ["\n", "\r", "\t", "\u0000", "\u001f", "\u007f", "\u2028", "\u2029"]) {
    assert.throws(
      () => normalizeSubscription(candidate(`Good${marker}Bad`)),
      /Subscription title is invalid/
    );
  }
});
