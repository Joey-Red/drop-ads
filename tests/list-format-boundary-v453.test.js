import test from "node:test";
import assert from "node:assert/strict";

import { MAX_LIST_FORMAT_CHARS, parseList } from "../src/core/lists.js";

const nativeText = "block domain ads.example.com\n";

test("M453 accepts the three reviewed primitive list formats", () => {
  assert.equal(parseList(nativeText, "drop-ads-v1").block.length, 1);
  assert.equal(parseList("ads.example.com\n", "third-party").block.length, 1);
  assert.equal(parseList("0.0.0.0 ads.example.com\n", "hosts").block.length, 1);
});

test("M453 rejects non-string formats without executing conversion hooks", () => {
  let conversions = 0;
  const hostile = {
    toString() { conversions += 1; return "drop-ads-v1"; },
    valueOf() { conversions += 1; return "drop-ads-v1"; }
  };

  assert.throws(() => parseList(nativeText, hostile), /List format is invalid/);
  assert.equal(conversions, 0);
});

test("M453 bounds and does not echo unsupported format text", () => {
  const oversized = "x".repeat(MAX_LIST_FORMAT_CHARS + 1);
  assert.throws(() => parseList(nativeText, oversized), /List format is invalid/);

  const marker = "secret-format-marker";
  assert.throws(
    () => parseList(nativeText, marker),
    (error) => error instanceof Error && error.message === "Unsupported list format" && !error.message.includes(marker)
  );
});
