import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const helper = fs.readFileSync(new URL("../src/content/cookie-banner-utils-composition.js", import.meta.url), "utf8");
const chromium = JSON.parse(fs.readFileSync(new URL("../manifests/chromium.json", import.meta.url), "utf8"));
const firefox = JSON.parse(fs.readFileSync(new URL("../manifests/firefox.json", import.meta.url), "utf8"));

function cookieEntry(manifest) {
  return manifest.content_scripts.find((entry) => entry.js?.includes("content/cookie-banner-controller.js"));
}

test("M1022 snapshots only the exact frozen data-descriptor utility surface", () => {
  assert.match(helper, /const EXPECTED_UTIL_KEYS = Object\.freeze\(\[/);
  assert.match(helper, /Object\.getOwnPropertyDescriptor\(globalThis, UTILS_GLOBAL\)/);
  assert.match(helper, /Reflect\.ownKeys\(utils\)/);
  assert.match(helper, /Object\.isFrozen\(utils\)/);
  assert.match(helper, /prototype !== Object\.prototype/);
  assert.match(helper, /descriptor\.writable \|\| descriptor\.configurable/);
  assert.match(helper, /keys\.length !== EXPECTED_UTIL_KEYS\.length/);
  assert.doesNotMatch(helper, /\.\.\.utils|Object\.assign/);
});

test("M1022 validates override objects without invoking accessors", () => {
  assert.match(helper, /const MAX_OVERRIDE_KEYS = 4/);
  assert.match(helper, /prototype !== Object\.prototype && prototype !== null/);
  assert.match(helper, /!EXPECTED_UTIL_KEY_SET\.has\(key\)/);
  assert.match(helper, /descriptor\.get \|\| descriptor\.set/);
  assert.match(helper, /Object\.defineProperty\(next, key/);
});

test("M1022 helper loads identically before all cookie-banner wrapper layers", () => {
  const chromiumEntry = cookieEntry(chromium);
  const firefoxEntry = cookieEntry(firefox);
  assert.deepEqual(chromiumEntry.js, firefoxEntry.js);
  const helperIndex = chromiumEntry.js.indexOf("content/cookie-banner-utils-composition.js");
  assert.equal(helperIndex, chromiumEntry.js.indexOf("content/cookie-banner-utils.js") + 1);
  assert.ok(helperIndex < chromiumEntry.js.indexOf("content/cookie-banner-locale-extension.js"));
  assert.ok(helperIndex < chromiumEntry.js.indexOf("content/cookie-banner-action-source-safety.js"));
});

test("M1022 composition helper has no persistence, network, profile, or telemetry surface", () => {
  assert.doesNotMatch(helper, /localStorage|sessionStorage|indexedDB|fetch\(|XMLHttpRequest|WebSocket|sendBeacon|analytics|telemetry|navigator\.language|navigator\.languages|Intl\./i);
});
