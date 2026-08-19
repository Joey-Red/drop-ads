import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/content/cookie-banner-action-context-safety.js", import.meta.url), "utf8");

test("M1024 action-context safety composes through descriptor-safe utility snapshots", () => {
  assert.match(source, /ownDataValue\(globalThis, "DropAdsCookieBannerUtilsComposition"\)/);
  assert.match(source, /ownDataValue\(composition, "snapshotUtils"\)/);
  assert.match(source, /ownDataValue\(composition, "replaceUtils"\)/);
  assert.match(source, /Reflect\.apply\(snapshotUtils, composition, \[\]\)/);
  assert.match(source, /ownDataValue\(utils, "textSnapshot"\)/);
  assert.match(source, /Reflect\.apply\(replaceUtils, composition, \[\{ textSnapshot \}\]\)/);
  assert.doesNotMatch(source, /\.\.\.utils|globalThis\.DropAdsCookieBannerUtils\s*=/);
});

test("M1024 preserves the action-context safety gates", () => {
  for (const needle of [
    "function activationAncestrySafe(element)",
    "function editableContextSafe(element)",
    "function editableDescendantsSafe(element",
    "function editableLabelledByTreesSafe(element)",
    "function popupLaunchSemanticsSafe(element)",
    "function toggleSemanticsSafe(element)",
    "function popoverTargetSemanticsSafe(element)"
  ]) assert.ok(source.includes(needle), `missing ${needle}`);
  assert.match(source, /const MAX_ACTIVATION_ANCESTOR_STEPS = 16/);
  assert.match(source, /const MAX_EDITABLE_ANCESTOR_STEPS = 16/);
  assert.match(source, /const MAX_CONTEXT_DESCENDANT_ELEMENTS = 128/);
});

test("M1024 action-context wrapper remains persistence/network/profile free", () => {
  assert.doesNotMatch(source, /localStorage|sessionStorage|indexedDB|fetch\(|XMLHttpRequest|WebSocket|sendBeacon|analytics|telemetry|navigator\.language|navigator\.languages|Intl\./i);
});
