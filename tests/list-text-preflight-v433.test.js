import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  MAX_REMOTE_LIST_TEXT_CHARS,
  assertRemoteListTextStructure
} from "../src/core/list-limits.js";
import { MAX_REMOTE_LIST_BYTES } from "../src/core/list-updates.js";

const source = fs.readFileSync(new URL("../src/core/list-limits.js", import.meta.url), "utf8");

test("M433 direct remote-list text ceiling matches the download byte ceiling numerically", () => {
  assert.equal(MAX_REMOTE_LIST_TEXT_CHARS, 5_000_000);
  assert.equal(MAX_REMOTE_LIST_TEXT_CHARS, MAX_REMOTE_LIST_BYTES);
});

test("M433 one-over raw text fails at the total-character preflight", () => {
  const oversized = "x".repeat(MAX_REMOTE_LIST_TEXT_CHARS + 1);
  assert.throws(
    () => assertRemoteListTextStructure(oversized),
    new RegExp(`exceeds ${MAX_REMOTE_LIST_TEXT_CHARS} characters`)
  );
});

test("M433 total-character admission runs before option and line scanning work", () => {
  const lengthCheck = source.indexOf("text.length > MAX_REMOTE_LIST_TEXT_CHARS");
  const optionsCheck = source.indexOf('assertPlainExactObject(options, "Remote list structure options"');
  const lineLoop = source.indexOf("for (let index = 0; index < text.length; index += 1)");
  assert.ok(lengthCheck >= 0, "total text preflight must exist");
  assert.ok(optionsCheck > lengthCheck, "option inspection must happen after total text preflight");
  assert.ok(lineLoop > lengthCheck, "line scanning must happen after total text preflight");
});
