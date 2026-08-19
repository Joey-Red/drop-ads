import assert from "node:assert/strict";
import test from "node:test";
import { snapshotSourceQualificationResults } from "../tools/source-qualification-summary.mjs";

const SOURCE_KEY = "hosts\u0000https://example.com/list.txt";

function subscription(overrides = {}) {
  return {
    id: "test-source",
    title: "  Test Source  ",
    format: "hosts",
    sourceUrl: "https://example.com/list.txt#fragment",
    enabled: true,
    builtIn: false,
    ...overrides
  };
}

function parsed() {
  return { block: [], allow: [], cosmeticHide: [], cosmeticAllow: [], sourceKey: SOURCE_KEY };
}

function result(overrides = {}) {
  return { subscription: subscription(), parsed: parsed(), declaredBytes: null, ...overrides };
}

test("normalizes subscription metadata before summary use", () => {
  const [snapshot] = snapshotSourceQualificationResults([result()]);
  assert.equal(snapshot.subscription.title, "Test Source");
  assert.equal(snapshot.subscription.sourceUrl, "https://example.com/list.txt");
  assert.equal(Object.isFrozen(snapshot.subscription), true);
});

test("requires null or non-negative safe declared bytes", () => {
  assert.equal(snapshotSourceQualificationResults([result({ declaredBytes: 0 })])[0].declaredBytes, 0);
  assert.throws(() => snapshotSourceQualificationResults([result({ declaredBytes: -1 })]), /declaredBytes/);
  assert.throws(() => snapshotSourceQualificationResults([result({ declaredBytes: 1.5 })]), /declaredBytes/);
  assert.throws(() => snapshotSourceQualificationResults([result({ declaredBytes: Number.MAX_SAFE_INTEGER + 1 })]), /declaredBytes/);
});

test("rejects hostile subscription accessors without invoking them", () => {
  let touched = false;
  const hostile = subscription();
  Object.defineProperty(hostile, "title", {
    enumerable: true,
    get() { touched = true; return "unsafe"; }
  });
  assert.throws(() => snapshotSourceQualificationResults([result({ subscription: hostile })]));
  assert.equal(touched, false);
});
