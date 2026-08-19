import test from "node:test";
import assert from "node:assert/strict";

import { MAX_REMOTE_LIST_TEXT_CHARS, assertRemoteListTextStructure } from "../src/core/list-limits.js";
import { MAX_REMOTE_LIST_BYTES } from "../src/core/list-updates.js";
import { parseNativeList } from "../src/core/lists.js";

test("M432 direct remote-list character ceiling matches the download byte ceiling", () => {
  assert.equal(MAX_REMOTE_LIST_TEXT_CHARS, 5_000_000);
  assert.equal(MAX_REMOTE_LIST_TEXT_CHARS, MAX_REMOTE_LIST_BYTES);
});

test("M432 one-over direct text fails before structural scanning", () => {
  const oversized = "a".repeat(MAX_REMOTE_LIST_TEXT_CHARS + 1);
  assert.throws(
    () => assertRemoteListTextStructure(oversized),
    new RegExp(`exceeds ${MAX_REMOTE_LIST_TEXT_CHARS} characters`)
  );
});

test("M432 parser text admission checks total size before NUL scanning", () => {
  const oversizedWithNul = `\u0000${"a".repeat(MAX_REMOTE_LIST_TEXT_CHARS)}`;
  assert.throws(
    () => parseNativeList(oversizedWithNul),
    new RegExp(`exceeds ${MAX_REMOTE_LIST_TEXT_CHARS} characters`)
  );
});
