import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/content/cookie-banner-action-semantics-safety.js", import.meta.url), "utf8");

test("M1025 action-semantics safety composes through descriptor-safe utility snapshots", () => {
  assert.match(source, /ownDataValue\(globalThis, "DropAdsCookieBannerUtilsComposition"\)/);
  assert.match(source, /ownDataValue\(composition, "snapshotUtils"\)/);
  assert.match(source, /ownDataValue\(composition, "replaceUtils"\)/);
  assert.match(source, /Reflect\.apply\(snapshotUtils, composition, \[\]\)/);
  assert.match(source, /ownDataValue\(utils, "textSnapshot"\)/);
  assert.match(source, /Reflect\.apply\(replaceUtils, composition, \[\{ textSnapshot \}\]\)/);
  assert.doesNotMatch(source, /\.\.\.utils|globalThis\.DropAdsCookieBannerUtils\s*=/);
});

test("M1025 preserves the action-semantics safety gates", () => {
  for (const needle of [
    "function disclosureSemanticsSafe(element)",
    "function formResetSemanticsSafe(element)",
    "function nativeRoleSemanticsSafe(element)",
    "function busySemanticsSafe(element)",
    "function controlledRegionSemanticsSafe(element)",
    "function declarativeCommandSemanticsSafe(element)"
  ]) assert.ok(source.includes(needle), `missing ${needle}`);
  assert.match(source, /const MAX_BUSY_ANCESTOR_STEPS = 16/);
  assert.match(source, /const DECLARATIVE_COMMAND_ATTRIBUTES = Object\.freeze/);
});

test("M1025 action-semantics wrapper remains persistence/network/profile free", () => {
  assert.doesNotMatch(source, /localStorage|sessionStorage|indexedDB|fetch\(|XMLHttpRequest|WebSocket|sendBeacon|analytics|telemetry|navigator\.language|navigator\.languages|Intl\./i);
});
