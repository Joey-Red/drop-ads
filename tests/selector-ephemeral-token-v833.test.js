import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/content/selector-utils.js", import.meta.url), "utf8");

test("M833 stable picker identity rejects generated-looking hash and numeric tokens", () => {
  assert.match(source, /if \(\/\^\[a-f0-9\]\{16,\}\$\/i\.test\(value\) \|\| \/\\d\{7,\}\/\.test\(value\)\) return null/);
  assert.match(source, /const token = stableToken\(raw\)/);
  assert.match(source, /return stableToken\(id\)/);
  assert.match(source, /const value = stableToken\(raw\)/);
});
