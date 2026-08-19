import assert from "node:assert/strict";
import test from "node:test";
import { subscriptionSourceKey } from "../src/core/subscriptions.js";
import { snapshotSourceQualificationResults } from "../tools/source-qualification-summary.mjs";

function source(id, url) {
  return { id, title: id, format: "hosts", sourceUrl: url, enabled: true, builtIn: true };
}

function result(subscription) {
  return {
    subscription,
    parsed: { block: [], allow: [], cosmeticHide: [], cosmeticAllow: [], sourceKey: subscriptionSourceKey(subscription) },
    declaredBytes: null
  };
}

test("successful source results reject duplicate normalized ids", () => {
  assert.throws(() => snapshotSourceQualificationResults([
    result(source("same", "https://example.com/a.txt")),
    result(source("same", "https://example.com/b.txt"))
  ]), /duplicate id/);
});

test("successful source results reject duplicate normalized source identities", () => {
  assert.throws(() => snapshotSourceQualificationResults([
    result(source("one", "https://example.com/list.txt#one")),
    result(source("two", "https://example.com/list.txt#two"))
  ]), /duplicate source identity/);
});
