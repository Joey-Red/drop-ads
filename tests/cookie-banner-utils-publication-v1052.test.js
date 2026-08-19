import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/content/cookie-banner-utils.js", import.meta.url), "utf8");

test("M1052 publishes the base cookie-banner utility API immutably", () => {
  assert.match(source, /const UTILS_GLOBAL = "DropAdsCookieBannerUtils"/);
  assert.match(source, /const MAX_PLATFORM_PROTOTYPE_DEPTH = 8/);
  assert.match(source, /function captureDescriptor\(receiver, key\)/);
  assert.match(source, /function captureData\(receiver, key\)/);
  assert.match(source, /function captureGetter\(receiver, key\)/);
  assert.match(source, /const api = Object\.freeze\(\{/);
  assert.match(source, /Object\.getOwnPropertyDescriptor\(globalThis, UTILS_GLOBAL\)/);
  assert.match(source, /if \(existing\) return/);
  assert.match(source, /Object\.defineProperty\(globalThis, UTILS_GLOBAL/);
  assert.match(source, /enumerable: false/);
  assert.match(source, /writable: false/);
  assert.match(source, /configurable: false/);
  assert.doesNotMatch(source, /globalThis\.DropAdsCookieBannerUtils\s*=/);
});

test("M1052 adds no persistence, network, profile, or telemetry surface", () => {
  assert.doesNotMatch(source, /localStorage|sessionStorage|indexedDB|fetch\(|XMLHttpRequest|WebSocket|sendBeacon|analytics|telemetry|navigator\.language|navigator\.languages/i);
});
