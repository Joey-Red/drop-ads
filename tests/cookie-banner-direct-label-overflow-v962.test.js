import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const safety = fs.readFileSync(new URL("../src/content/cookie-banner-action-source-safety.js", import.meta.url), "utf8");
const chromium = JSON.parse(fs.readFileSync(new URL("../manifests/chromium.json", import.meta.url), "utf8"));
const firefox = JSON.parse(fs.readFileSync(new URL("../manifests/firefox.json", import.meta.url), "utf8"));

function cookieEntry(manifest) {
  return manifest.content_scripts.find((entry) => entry.js?.includes("content/cookie-banner-controller.js"));
}

test("oversized direct action labels fail closed before canonical text extraction", () => {
  assert.match(safety, /const MAX_ACTION_RAW_CHARS = 512/);
  assert.match(safety, /const MAX_ACTION_TEXT_CHARS = 160/);
  assert.match(safety, /for \(const source of \[channels\.value, channels\.ariaLabel\]\)/);
  assert.match(safety, /source\.length > MAX_ACTION_RAW_CHARS/);
  assert.match(safety, /normalizedLength\(source\) > MAX_ACTION_TEXT_CHARS/);
  assert.match(safety, /!directSourcesWithinBounds\(element\)/);
  assert.doesNotMatch(safety, /localStorage|sessionStorage|indexedDB|fetch\(|XMLHttpRequest|sendBeacon|analytics|telemetry/i);
});

test("action-source safety layer has Chromium and Firefox ordering parity", () => {
  const chromiumEntry = cookieEntry(chromium);
  const firefoxEntry = cookieEntry(firefox);
  assert.deepEqual(chromiumEntry, firefoxEntry);
  const utilsIndex = chromiumEntry.js.indexOf("content/cookie-banner-utils.js");
  const compositionIndex = chromiumEntry.js.indexOf("content/cookie-banner-utils-composition.js");
  const localeIndex = chromiumEntry.js.indexOf("content/cookie-banner-locale-extension.js");
  const safetyIndex = chromiumEntry.js.indexOf("content/cookie-banner-action-source-safety.js");
  const executorIndex = chromiumEntry.js.indexOf("content/cookie-banner-executor.js");
  assert.ok(utilsIndex >= 0 && compositionIndex === utilsIndex + 1 && localeIndex === compositionIndex + 1 && safetyIndex === localeIndex + 1 && executorIndex > safetyIndex);
  assert.equal(chromiumEntry.all_frames, false);
});
