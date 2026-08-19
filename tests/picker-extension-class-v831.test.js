import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/content/selector-utils.js", import.meta.url), "utf8");

test("picker selectors ignore Drop Ads-owned helper class tokens", () => {
  assert.match(source, /function extensionOwnedClassToken\(token\)/);
  assert.match(source, /token\.startsWith\("drop-ads-"\)/);
  assert.match(source, /if \(!token \|\| extensionOwnedClassToken\(token\)\) continue;/);
});
