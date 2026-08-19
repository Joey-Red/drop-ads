import test from "node:test";
import assert from "node:assert/strict";
import { assertRemoteListTextStructure, assertRemoteSupportedRuleCount } from "../src/core/list-limits.js";

test("remote list structure accepts boundaries and reports deterministic diagnostics", () => {
  assert.deepEqual(assertRemoteListTextStructure("a\nbb\nccc", { maxLines: 3, maxLineChars: 3 }), {
    lines: 3,
    longestLineChars: 3
  });
});

test("remote list structure rejects excessive lines and line length before parsing", () => {
  assert.throws(() => assertRemoteListTextStructure("a\nb\nc", { maxLines: 2, maxLineChars: 10 }), /too many lines/);
  assert.throws(() => assertRemoteListTextStructure("12345", { maxLines: 2, maxLineChars: 4 }), /excessively long line/);
});

test("supported network plus cosmetic output is hard bounded rather than truncated", () => {
  const parsed = { block: [{}, {}], allow: [{}] };
  const cosmetic = { hide: [{}], allow: [] };
  assert.equal(assertRemoteSupportedRuleCount(parsed, cosmetic, 4), 4);
  assert.throws(() => assertRemoteSupportedRuleCount(parsed, cosmetic, 3), /too many supported rules/);
});
