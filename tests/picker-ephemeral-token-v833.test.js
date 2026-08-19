import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/content/selector-utils.js", import.meta.url), "utf8");

test("M833 picker tokens reject hash-like and long numeric generated identities", () => {
  assert.match(source, /if \(\/\^\[a-f0-9\]\{16,\}\$\/i\.test\(value\) \|\| \/\\d\{7,\}\/\.test\(value\)\) return null;/);
  assert.match(source, /const token = stableToken\(raw\);/);
  assert.match(source, /const id = elementIdToken\(element\);/);
  assert.match(source, /const value = stableToken\(raw\);/);
});
