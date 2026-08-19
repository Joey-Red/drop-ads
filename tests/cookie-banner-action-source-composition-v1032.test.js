import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/content/cookie-banner-action-source-safety.js", import.meta.url), "utf8");

test("M1032 action-source wrapper uses descriptor-safe utility composition", () => {
  assert.match(source, /Object\.getOwnPropertyDescriptor\(object, key\)/);
  assert.match(source, /DropAdsCookieBannerUtilsComposition/);
  assert.match(source, /ownDataValue\(composition, "snapshotUtils"\)/);
  assert.match(source, /ownDataValue\(composition, "replaceUtils"\)/);
  assert.match(source, /Reflect\.apply\(snapshotUtils, composition, \[\]\)/);
  assert.match(source, /Reflect\.apply\(replaceUtils, composition, \[\{ textSnapshot \}\]\)/);
  assert.doesNotMatch(source, /\.\.\.utils/);
  assert.doesNotMatch(source, /globalThis\.DropAdsCookieBannerUtils\s*=/);
});

test("M1032 preserves action-source safety gates and privacy boundary", () => {
  for (const marker of [
    "directChannelsAgree(element)",
    "actionTreeExcludesDropAdsOwned(element)",
    "actionTreeExcludesInteractiveDescendants(element)",
    "actionTreeExcludesHiddenText(element)",
    "labelledByAndOtherNamesAgree(element)",
    "navigationAncestrySafe(element)"
  ]) assert.ok(source.includes(marker), `missing preserved guard ${marker}`);
  assert.doesNotMatch(source, /localStorage|sessionStorage|indexedDB|fetch\(|XMLHttpRequest|WebSocket|sendBeacon|analytics|telemetry|navigator\.language|navigator\.languages/i);
});
