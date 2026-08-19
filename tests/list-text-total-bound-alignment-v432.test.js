import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { MAX_REMOTE_LIST_TEXT_CHARS } from "../src/core/list-limits.js";
import { MAX_REMOTE_LIST_BYTES } from "../src/core/list-updates.js";

const source = fs.readFileSync(new URL("../src/core/list-limits.js", import.meta.url), "utf8");

test("direct text ceiling stays numerically aligned with the remote download byte ceiling", () => {
  assert.equal(MAX_REMOTE_LIST_TEXT_CHARS, 5_000_000);
  assert.equal(MAX_REMOTE_LIST_TEXT_CHARS, MAX_REMOTE_LIST_BYTES);
});

test("total text preflight occurs before structural scanning", () => {
  const functionStart = source.indexOf("export function assertRemoteListTextStructure");
  const lengthGate = source.indexOf("text.length > MAX_REMOTE_LIST_TEXT_CHARS", functionStart);
  const scan = source.indexOf("for (let index = 0; index < text.length; index += 1)", functionStart);
  assert.ok(functionStart >= 0 && lengthGate > functionStart && scan > lengthGate);
});
