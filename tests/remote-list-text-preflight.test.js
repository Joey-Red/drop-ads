import test from "node:test";
import assert from "node:assert/strict";

import { MAX_REMOTE_LIST_TEXT_CHARS, assertRemoteListTextStructure } from "../src/core/list-limits.js";
import { MAX_REMOTE_LIST_BYTES } from "../src/core/list-updates.js";

test("direct remote-list character ceiling is locked to the download byte ceiling", () => {
  assert.equal(MAX_REMOTE_LIST_TEXT_CHARS, MAX_REMOTE_LIST_BYTES);
});

test("one-over direct remote-list text fails before per-line scanning can decide the input", () => {
  const oversizedSingleLine = "a".repeat(MAX_REMOTE_LIST_TEXT_CHARS + 1);
  assert.throws(
    () => assertRemoteListTextStructure(oversizedSingleLine),
    new RegExp(`Remote filter list exceeds ${MAX_REMOTE_LIST_TEXT_CHARS} characters`)
  );
});

test("custom lower line ceilings remain authoritative inside the raw text ceiling", () => {
  assert.throws(
    () => assertRemoteListTextStructure("first\nsecond\nthird", { maxLines: 2 }),
    /too many lines/
  );
  assert.throws(
    () => assertRemoteListTextStructure("abcdef", { maxLineChars: 5 }),
    /excessively long line/
  );
});
