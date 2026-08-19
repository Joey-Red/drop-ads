import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/options/country.js", import.meta.url), "utf8");

test("Country Settings owns and disposes its personal-list MutationObserver", () => {
  assert.match(source, /let personalListObserver = null/);
  assert.match(source, /personalListObserver = new MutationObserver/);
  assert.match(source, /personalListObserver\.observe\(blockList, \{ childList: true, subtree: true \}\)/);
  assert.match(source, /window\.addEventListener\("pagehide"/);
  assert.match(source, /personalListObserver\?\.disconnect\(\)/);
  assert.match(source, /personalListObserver = null/);
});
