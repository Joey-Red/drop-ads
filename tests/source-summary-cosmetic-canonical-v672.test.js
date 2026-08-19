import assert from "node:assert/strict";
import test from "node:test";
import { subscriptionSourceKey } from "../src/core/subscriptions.js";
import { snapshotSourceQualificationResults } from "../tools/source-qualification-summary.mjs";

function subscription() {
  return { id: "source-a", title: "Source A", format: "third-party", sourceUrl: "https://example.com/list.txt", enabled: true, builtIn: false };
}

function result(cosmeticHide = [], cosmeticAllow = []) {
  const source = subscription();
  return {
    subscription: source,
    parsed: { block: [], allow: [], cosmeticHide, cosmeticAllow, sourceKey: subscriptionSourceKey(source) },
    declaredBytes: null
  };
}

test("cosmetic rules are normalized and deeply frozen during source snapshot", () => {
  const [snapshot] = snapshotSourceQualificationResults([result([
    { selector: "  .ad-banner  ", domains: ["Example.COM", "example.com"], excludedDomains: ["Sub.Example.com"] }
  ])]);
  const rule = snapshot.parsed.cosmeticHide[0];
  assert.equal(rule.selector, ".ad-banner");
  assert.deepEqual(rule.domains, ["example.com"]);
  assert.deepEqual(rule.excludedDomains, ["sub.example.com"]);
  assert.equal(Object.isFrozen(rule), true);
  assert.equal(Object.isFrozen(rule.domains), true);
  assert.equal(Object.isFrozen(rule.excludedDomains), true);
});

test("source snapshot no longer retains caller-owned cosmetic rule objects", () => {
  const rule = { selector: ".ad" };
  const [snapshot] = snapshotSourceQualificationResults([result([rule])]);
  rule.selector = ".changed";
  assert.equal(snapshot.parsed.cosmeticHide[0].selector, ".ad");
  assert.notEqual(snapshot.parsed.cosmeticHide[0], rule);
});

test("cosmetic rule accessors fail closed without becoming summary state", () => {
  let touched = false;
  const rule = {};
  Object.defineProperty(rule, "selector", { enumerable: true, get() { touched = true; return ".ad"; } });
  assert.throws(() => snapshotSourceQualificationResults([result([rule])]));
  assert.equal(touched, false);
});
