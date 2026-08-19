import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/content/cookie-banner-action-source-safety.js", import.meta.url), "utf8");

test("M974 excludes Drop Ads-owned descendants from page action names", () => {
  assert.match(source, /const MAX_ACTION_ELEMENT_NODES = 128;/);
  assert.match(source, /function actionTreeExcludesDropAdsOwned\(element\)/);
  assert.match(source, /owned = Reflect\.apply\(isDropAdsOwned, undefined, \[node\]\)/);
  assert.match(source, /visited > MAX_ACTION_ELEMENT_NODES \|\| owned/);
  assert.match(source, /!actionTreeExcludesDropAdsOwned\(element\)/);
});

test("M974 remains transient and local", () => {
  assert.doesNotMatch(source, /localStorage|sessionStorage|indexedDB|fetch\(|XMLHttpRequest|sendBeacon|analytics|telemetry/i);
});
