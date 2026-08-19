import test from "node:test";
import assert from "node:assert/strict";
import {
  MAX_REMOTE_LIST_TEXT_CHARS,
  assertRemoteListTextStructure
} from "../src/core/list-limits.js";
import { MAX_REMOTE_LIST_BYTES } from "../src/core/list-updates.js";

test("direct remote-list character ceiling matches the download byte ceiling numerically", () => {
  assert.equal(MAX_REMOTE_LIST_TEXT_CHARS, MAX_REMOTE_LIST_BYTES);
  assert.equal(MAX_REMOTE_LIST_TEXT_CHARS, 5_000_000);
});

test("direct remote-list text rejects one-over before structural line scanning", () => {
  assert.throws(
    () => assertRemoteListTextStructure("x".repeat(MAX_REMOTE_LIST_TEXT_CHARS + 1)),
    new RegExp(`exceeds ${MAX_REMOTE_LIST_TEXT_CHARS} characters`)
  );
});
