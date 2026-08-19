import assert from "node:assert/strict";
import test from "node:test";
import { subscriptionSourceKey } from "../src/core/subscriptions.js";
import { snapshotSourceQualificationResults } from "../tools/source-qualification-summary.mjs";

function subscription() {
  return { id: "source-a", title: "Source A", format: "hosts", sourceUrl: "https://example.com/list.txt", enabled: true, builtIn: false };
}

function result(block = [], allow = []) {
  const source = subscription();
  return {
    subscription: source,
    parsed: { block, allow, cosmeticHide: [], cosmeticAllow: [], sourceKey: subscriptionSourceKey(source) },
    declaredBytes: null
  };
}

test("network rules are normalized and deeply frozen during source snapshot", () => {
  const [snapshot] = snapshotSourceQualificationResults([result([
    { kind: "domain", value: "Example.COM." },
    { kind: "url", value: "https://example.com/path#fragment", resourceTypes: ["script", "image"] }
  ])]);
  assert.equal(snapshot.parsed.block[0].value, "example.com");
  assert.equal(snapshot.parsed.block[1].value, "https://example.com/path");
  assert.deepEqual(snapshot.parsed.block[1].resourceTypes, ["image", "script"]);
  assert.equal(Object.isFrozen(snapshot.parsed.block[0]), true);
  assert.equal(Object.isFrozen(snapshot.parsed.block[1]), true);
  assert.equal(Object.isFrozen(snapshot.parsed.block[1].resourceTypes), true);
});

test("source snapshot no longer retains caller-owned network rule objects", () => {
  const rule = { kind: "domain", value: "example.com" };
  const [snapshot] = snapshotSourceQualificationResults([result([rule])]);
  rule.value = "changed.example";
  assert.equal(snapshot.parsed.block[0].value, "example.com");
  assert.notEqual(snapshot.parsed.block[0], rule);
});

test("network rule accessors fail closed without becoming summary state", () => {
  let touched = false;
  const rule = { kind: "domain" };
  Object.defineProperty(rule, "value", { enumerable: true, get() { touched = true; return "example.com"; } });
  assert.throws(() => snapshotSourceQualificationResults([result([rule])]));
  assert.equal(touched, false);
});
