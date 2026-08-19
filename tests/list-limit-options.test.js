import assert from "node:assert/strict";
import test from "node:test";

import {
  MAX_REMOTE_LIST_LINE_CHARS,
  MAX_REMOTE_LIST_LINES,
  MAX_REMOTE_SUPPORTED_RULES,
  assertRemoteListTextStructure,
  assertRemoteSupportedRuleCount
} from "../src/core/list-limits.js";

test("remote list structure options reject accessors without getter execution", () => {
  let reads = 0;
  const options = {};
  Object.defineProperty(options, "maxLines", {
    enumerable: true,
    get() {
      reads += 1;
      return 2;
    }
  });
  assert.throws(() => assertRemoteListTextStructure("a", options), /data field/);
  assert.equal(reads, 0);
});

test("remote list structure options are exact and cannot raise reviewed ceilings", () => {
  assert.throws(() => assertRemoteListTextStructure("a", { unknown: 1 }), /unsupported field/);
  assert.throws(() => assertRemoteListTextStructure("a", { maxLines: MAX_REMOTE_LIST_LINES + 1 }), /no greater than 300000/);
  assert.throws(() => assertRemoteListTextStructure("a", { maxLineChars: MAX_REMOTE_LIST_LINE_CHARS + 1 }), /no greater than 16384/);
  assert.throws(() => assertRemoteListTextStructure("a", { maxLines: "2" }), /positive safe integer/);
  assert.throws(() => assertRemoteListTextStructure("a", { maxLineChars: 1.5 }), /positive safe integer/);
});

test("lower remote list structure limits remain useful for deterministic tests", () => {
  assert.deepEqual(assertRemoteListTextStructure("a\nb", { maxLines: 2, maxLineChars: 1 }), { lines: 2, longestLineChars: 1 });
  assert.throws(() => assertRemoteListTextStructure("a\nb\nc", { maxLines: 2 }), /too many lines/);
  assert.throws(() => assertRemoteListTextStructure("ab", { maxLineChars: 1 }), /excessively long line/);
});

test("supported-rule override cannot raise or type-confuse the production ceiling", () => {
  const parsed = { block: [], allow: [], unsupportedCount: 0 };
  const cosmetic = { hide: [], allow: [], unsupportedCount: 0 };
  assert.equal(assertRemoteSupportedRuleCount(parsed, cosmetic), 0);
  assert.equal(assertRemoteSupportedRuleCount(parsed, cosmetic, 1), 0);
  for (const invalid of [0, -1, 1.5, "1", Number.MAX_SAFE_INTEGER + 1, Number.POSITIVE_INFINITY, MAX_REMOTE_SUPPORTED_RULES + 1]) {
    assert.throws(() => assertRemoteSupportedRuleCount(parsed, cosmetic, invalid), /positive safe integer/);
  }
});
