import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/content/selector-utils.js", import.meta.url), "utf8");

test("M832 stable picker identity rejects invisible formatting tokens", () => {
  assert.match(source, /\\u034f/);
  assert.match(source, /\\u061c/);
  assert.match(source, /\\u180e/);
  assert.match(source, /\\u200b-\\u200f/);
  assert.match(source, /\\u2060/);
  assert.match(source, /\\u2066-\\u2069/);
  assert.match(source, /\\ufeff/);
  assert.match(source, /if \(\/\[.*\]\/\.test\(value\)\) return null/);
});
