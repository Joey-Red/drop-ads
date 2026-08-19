import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/content/selector-utils.js", import.meta.url), "utf8");

test("picker identity tokens reject invisible and control-format characters", () => {
  assert.match(source, /\\u0000-\\u001f/);
  assert.match(source, /\\u007f/);
  assert.match(source, /\\u034f/);
  assert.match(source, /\\u061c/);
  assert.match(source, /\\u200b-\\u200f/);
  assert.match(source, /\\u202a-\\u202e/);
  assert.match(source, /\\u2066-\\u2069/);
  assert.match(source, /\\ufeff/);
});
