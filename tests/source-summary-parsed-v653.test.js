import assert from "node:assert/strict";
import test from "node:test";
import { MAX_REMOTE_SUPPORTED_RULES } from "../src/core/list-limits.js";
import { snapshotSourceQualificationResults } from "../tools/source-qualification-summary.mjs";

const SOURCE_KEY = "hosts\u0000https://example.com/list.txt";

function subscription() {
  return {
    id: "test-source",
    title: "Test Source",
    format: "hosts",
    sourceUrl: "https://example.com/list.txt",
    enabled: true,
    builtIn: false
  };
}

function parsed(overrides = {}) {
  return { block: [], allow: [], cosmeticHide: [], cosmeticAllow: [], sourceKey: SOURCE_KEY, ...overrides };
}

function result(parsedValue) {
  return { subscription: subscription(), parsed: parsedValue, declaredBytes: null };
}

test("snapshots and freezes all parsed rule arrays", () => {
  const [snapshot] = snapshotSourceQualificationResults([result(parsed())]);
  assert.equal(Object.isFrozen(snapshot.parsed), true);
  assert.equal(Object.isFrozen(snapshot.parsed.block), true);
  assert.equal(Object.isFrozen(snapshot.parsed.allow), true);
  assert.equal(Object.isFrozen(snapshot.parsed.cosmeticHide), true);
  assert.equal(Object.isFrozen(snapshot.parsed.cosmeticAllow), true);
});

test("rejects parsed accessors without invoking them", () => {
  let touched = false;
  const value = parsed();
  Object.defineProperty(value, "block", {
    enumerable: true,
    get() { touched = true; return []; }
  });
  assert.throws(() => snapshotSourceQualificationResults([result(value)]));
  assert.equal(touched, false);
});

test("rejects parsed extra fields and oversized arrays before rule-key work", () => {
  assert.throws(() => snapshotSourceQualificationResults([result({ ...parsed(), extra: true })]));
  assert.throws(() => snapshotSourceQualificationResults([result(parsed({ block: new Array(MAX_REMOTE_SUPPORTED_RULES + 1) }))]));
});
