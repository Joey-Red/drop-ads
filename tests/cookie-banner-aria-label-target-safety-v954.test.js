import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/content/cookie-banner-utils.js", import.meta.url), "utf8");

test("aria-labelledby rejection labels refuse unsafe reference targets through captured state", () => {
  assert.match(source, /function labelReferenceSafe\(target\)/);
  assert.match(source, /!nodeConnected\(target\) \|\| isDropAdsOwned\(target\)/);
  assert.match(source, /\["a", "area", "button", "input", "select", "textarea"\]\.includes\(tag\)/);
  assert.match(source, /const role = elementAttribute\(target, "role"\)/);
  assert.match(source, /role !== "button" && role !== "link"/);
  assert.match(source, /targetRoot !== root \|\| !labelReferenceSafe\(target\)/);
  assert.doesNotMatch(source, /target\?\.isConnected|target\.getAttribute/);
});
