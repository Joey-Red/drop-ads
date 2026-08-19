import test from "node:test";
import assert from "node:assert/strict";

import { MAX_REMOTE_LIST_BYTES } from "../src/core/list-updates.js";
import { MAX_REMOTE_LIST_TEXT_CHARS, assertRemoteListTextStructure } from "../src/core/list-limits.js";

test("M432 direct list text ceiling is numerically locked to the download byte ceiling", () => {
  assert.equal(MAX_REMOTE_LIST_TEXT_CHARS, MAX_REMOTE_LIST_BYTES);
});

test("M432 one-over direct list text fails before line scanning semantics can matter", () => {
  const oversized = "a".repeat(MAX_REMOTE_LIST_TEXT_CHARS + 1);
  assert.throws(() => assertRemoteListTextStructure(oversized), /exceeds 5000000 characters/);
});
