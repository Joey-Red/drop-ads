import assert from "node:assert/strict";
import test from "node:test";
import { subscriptionSourceKey } from "../src/core/subscriptions.js";
import { summarizeQualifiedSources } from "../tools/source-qualification.mjs";

function subscription() {
  return {
    id: "example",
    title: "Example",
    format: "hosts",
    sourceUrl: "https://example.com/list.txt",
    enabled: true,
    builtIn: true
  };
}

function result(block) {
  const source = subscription();
  return {
    subscription: source,
    parsed: { block, allow: [], cosmeticHide: [], cosmeticAllow: [], sourceKey: subscriptionSourceKey(source) },
    declaredBytes: null
  };
}

test("source summary rejects duplicate canonical network block rules", () => {
  const rule = { kind: "domain", value: "ads.example.com" };
  assert.throws(() => summarizeQualifiedSources([result([rule, { ...rule }])]), /duplicate canonical rule/);
});

test("source summary accepts distinct canonical network rules", () => {
  const summary = summarizeQualifiedSources([result([
    { kind: "domain", value: "ads.example.com" },
    { kind: "domain", value: "tracker.example.com" }
  ])]);
  assert.equal(summary.sources[0].network.supported, 2);
  assert.equal(summary.sources[0].network.uniqueContribution, 2);
});
