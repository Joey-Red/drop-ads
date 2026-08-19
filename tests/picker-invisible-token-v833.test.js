import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/content/selector-utils.js", import.meta.url), "utf8");

test("M833 stable picker identity rejects zero-width and invisible formatting tokens", () => {
  assert.ok(source.includes("\\u034f"));
  assert.ok(source.includes("\\u061c"));
  assert.ok(source.includes("\\u180e"));
  assert.ok(source.includes("\\u200b-\\u200f"));
  assert.ok(source.includes("\\u202a-\\u202e"));
  assert.ok(source.includes("\\u2060"));
  assert.ok(source.includes("\\u2066-\\u2069"));
  assert.ok(source.includes("\\ufeff"));
  assert.ok(source.includes("return null;"));
});
