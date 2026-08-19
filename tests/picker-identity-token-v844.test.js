import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/content/selector-utils.js", import.meta.url), "utf8");

test("M844 picker identity tokens reject unstable or URL-like values", () => {
  assert.match(source, /if \(value !== value\.trim\(\)\) return null;/);
  assert.match(source, /value\.length > 80/);
  for (const token of ["\\u034f", "\\u061c", "\\u180e", "\\u200b-\\u200f", "\\u202a-\\u202e", "\\u2060", "\\u2066-\\u2069", "\\ufeff"]) {
    assert.ok(source.includes(token), `missing invisible-token rejection ${token}`);
  }
  assert.match(source, /\[\/\?#@=&%\]/);
  assert.match(source, /\^\[a-f0-9\]\{16,\}\$/);
  assert.match(source, /\\d\{7,\}/);
});
