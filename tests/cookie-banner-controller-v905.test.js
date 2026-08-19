import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const controller = fs.readFileSync(new URL("../src/content/cookie-banner-controller.js", import.meta.url), "utf8");
const chromium = JSON.parse(fs.readFileSync(new URL("../manifests/chromium.json", import.meta.url), "utf8"));
const firefox = JSON.parse(fs.readFileSync(new URL("../manifests/firefox.json", import.meta.url), "utf8"));

function cookieEntry(manifest) {
  return manifest.content_scripts.find((entry) => entry.js.includes("content/cookie-banner-controller.js"));
}

const CANONICAL_COOKIE_SCRIPTS = [
  "content/cookie-banner-utils.js",
  "content/cookie-banner-utils-composition.js",
  "content/cookie-banner-locale-extension.js",
  "content/cookie-banner-action-source-safety.js",
  "content/cookie-banner-action-context-safety.js",
  "content/cookie-banner-action-semantics-safety.js",
  "content/cookie-banner-shadow-roots.js",
  "content/cookie-banner-consent-safety.js",
  "content/cookie-banner-executor.js",
  "content/cookie-banner-controller.js"
];

test("cookie-banner controller is top-level only and sends only document domain policy input", () => {
  assert.match(controller, /const topGetter = captureGetter\(globalThis, "top"\)/);
  assert.match(controller, /readGetter\(topGetter, globalThis\) !== globalThis/);
  assert.match(controller, /const hostnameGetter = captureGetter\(location, "hostname"\)/);
  assert.match(controller, /const domain = readGetter\(hostnameGetter, location\)/);
  assert.match(controller, /Object\.freeze\(\{ type: MESSAGE_TYPE, domain \}\)/);
  assert.doesNotMatch(controller, /globalThis\.top\b|globalThis\.location\?\.|location\.href|document\.title|innerHTML|outerHTML|storage|localStorage|sessionStorage|indexedDB/);
});

test("cookie-banner controller validates exact minimal policy response and attempts one captured activation", () => {
  assert.match(controller, /keys\.length !== 1 \|\| keys\[0\] !== "enabled"/);
  assert.match(controller, /typeof descriptor\.value === "boolean"/);
  assert.match(controller, /descriptor\.value === true/);
  assert.match(controller, /if \(!active \|\| started\) return false/);
  assert.match(controller, /const root = currentDocumentElement\(\)/);
  assert.match(controller, /Reflect\.apply\(discoverActionCandidates, undefined, \[root\]\)/);
  assert.match(controller, /Reflect\.apply\(activateRejectionCandidate, undefined, \[candidate\]\) === true/);
});

test("Chromium and Firefox ship the same top-level cookie-banner script bundle", () => {
  const chromeEntry = cookieEntry(chromium);
  const firefoxEntry = cookieEntry(firefox);
  assert.ok(chromeEntry);
  assert.deepEqual(firefoxEntry, chromeEntry);
  assert.equal(chromeEntry.all_frames, false);
  assert.deepEqual(chromeEntry.js, CANONICAL_COOKIE_SCRIPTS);
});
