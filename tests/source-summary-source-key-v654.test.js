import assert from "node:assert/strict";
import test from "node:test";
import { snapshotSourceQualificationResults } from "../tools/source-qualification-summary.mjs";

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

function result(sourceKey) {
  return {
    subscription: subscription(),
    parsed: { block: [], allow: [], cosmeticHide: [], cosmeticAllow: [], sourceKey },
    declaredBytes: null
  };
}

test("accepts the exact normalized subscription source key", () => {
  const [snapshot] = snapshotSourceQualificationResults([result("hosts\u0000https://example.com/list.txt")]);
  assert.equal(snapshot.parsed.sourceKey, "hosts\u0000https://example.com/list.txt");
});

test("rejects parsed policy bound to another source", () => {
  assert.throws(
    () => snapshotSourceQualificationResults([result("hosts\u0000https://example.net/list.txt")]),
    /does not match its subscription/
  );
});

test("binding uses the normalized subscription URL", () => {
  const candidate = result("hosts\u0000https://example.com/list.txt");
  candidate.subscription.sourceUrl = "https://example.com/list.txt#ignored-fragment";
  const [snapshot] = snapshotSourceQualificationResults([candidate]);
  assert.equal(snapshot.subscription.sourceUrl, "https://example.com/list.txt");
  assert.equal(snapshot.parsed.sourceKey, "hosts\u0000https://example.com/list.txt");
});
