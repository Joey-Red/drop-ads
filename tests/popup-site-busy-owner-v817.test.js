import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/popup/popup.js", import.meta.url), "utf8");

test("site-scoped popup mutations publish and release site-section busy state", () => {
  assert.match(source, /let pendingSiteMutations = 0;/);
  assert.match(source, /function isSiteBusyControl\(control\)/);
  assert.match(source, /control === siteEnabled[\s\S]*control === cookieSiteEnabled[\s\S]*control === pauseSite[\s\S]*control === pickElement/);
  assert.match(source, /if \(siteScoped\) \{\n    pendingSiteMutations \+= 1;\n    siteSection\?\.setAttribute\("aria-busy", "true"\);/);
  assert.match(source, /pendingSiteMutations = Math\.max\(0, pendingSiteMutations - 1\);/);
  assert.match(source, /else siteSection\.removeAttribute\("aria-busy"\);/);
  assert.match(source, /pendingMutations = 0;\n  pendingSiteMutations = 0;/);
});
