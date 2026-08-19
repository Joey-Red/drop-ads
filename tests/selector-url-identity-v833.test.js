import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/content/selector-utils.js", import.meta.url), "utf8");

test("picker identity tokens reject URL/query/address-shaped values", () => {
  assert.match(source, /\[\/\?#@=&%\]/);
  assert.match(source, /function stableToken\(value\)/);
  assert.match(source, /const value = stableToken\(raw\)/);
  assert.match(source, /const token = stableToken\(raw\)/);
});
