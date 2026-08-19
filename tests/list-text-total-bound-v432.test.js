import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

import {
  MAX_REMOTE_LIST_TEXT_CHARS,
  assertRemoteListTextStructure
} from "../src/core/list-limits.js";
import { MAX_REMOTE_LIST_BYTES } from "../src/core/list-updates.js";

const source = fs.readFileSync(new URL("../src/core/list-limits.js", import.meta.url), "utf8");

test("M432 direct remote-list character ceiling matches the download byte ceiling numerically", () => {
  assert.equal(MAX_REMOTE_LIST_TEXT_CHARS, MAX_REMOTE_LIST_BYTES);
  assert.equal(MAX_REMOTE_LIST_TEXT_CHARS, 5_000_000);
});

test("M432 one-over raw text fails before structural line scanning", () => {
  const oversized = "x".repeat(MAX_REMOTE_LIST_TEXT_CHARS + 1);
  assert.throws(
    () => assertRemoteListTextStructure(oversized),
    new RegExp(`exceeds ${MAX_REMOTE_LIST_TEXT_CHARS} characters`)
  );

  const start = source.indexOf("export function assertRemoteListTextStructure");
  const end = source.indexOf("\n}\n", start);
  const body = source.slice(start, end);
  const limitCheck = body.indexOf("text.length > MAX_REMOTE_LIST_TEXT_CHARS");
  const scanLoop = body.indexOf("for (let index = 0; index < text.length; index += 1)");
  assert.ok(limitCheck >= 0);
  assert.ok(scanLoop >= 0);
  assert.ok(limitCheck < scanLoop);
});

test("M432 ordinary small text retains the existing structural result", () => {
  assert.deepEqual(assertRemoteListTextStructure("example.com\n# comment\n"), {
    lines: 3,
    longestLineChars: 11
  });
});
