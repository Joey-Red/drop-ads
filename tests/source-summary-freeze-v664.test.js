import assert from "node:assert/strict";
import test from "node:test";
import { subscriptionSourceKey } from "../src/core/subscriptions.js";
import { summarizeQualifiedSources } from "../tools/source-qualification.mjs";

function result() {
  const subscription = {
    id: "example",
    title: "Example",
    format: "hosts",
    sourceUrl: "https://example.com/list.txt",
    enabled: true,
    builtIn: true
  };
  return {
    subscription,
    parsed: {
      block: [{ kind: "domain", value: "ads.example.com" }],
      allow: [],
      cosmeticHide: [],
      cosmeticAllow: [],
      sourceKey: subscriptionSourceKey(subscription)
    },
    declaredBytes: 12
  };
}

test("source summary returns deeply frozen report fragment", () => {
  const summary = summarizeQualifiedSources([result()]);
  assert.equal(Object.isFrozen(summary), true);
  assert.equal(Object.isFrozen(summary.sources), true);
  assert.equal(Object.isFrozen(summary.sources[0]), true);
  assert.equal(Object.isFrozen(summary.sources[0].network), true);
  assert.equal(Object.isFrozen(summary.sources[0].cosmetic), true);
  assert.equal(Object.isFrozen(summary.totals), true);
});
