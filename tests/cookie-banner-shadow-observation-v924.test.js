import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const helper = fs.readFileSync(new URL("../src/content/cookie-banner-shadow-roots.js", import.meta.url), "utf8");
const controller = fs.readFileSync(new URL("../src/content/cookie-banner-controller.js", import.meta.url), "utf8");
const chromium = JSON.parse(fs.readFileSync(new URL("../manifests/chromium.json", import.meta.url), "utf8"));
const firefox = JSON.parse(fs.readFileSync(new URL("../manifests/firefox.json", import.meta.url), "utf8"));

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

test("cookie-banner late observation includes bounded existing open shadow roots", () => {
  assert.match(helper, /MAX_SHADOW_SCAN_NODES = 2_000/);
  assert.match(helper, /MAX_OPEN_SHADOW_ROOTS = 32/);
  assert.match(helper, /MAX_OPEN_SHADOW_DEPTH = 4/);
  assert.match(helper, /captureGetter\(ElementPrototype, "shadowRoot"\)/);
  assert.match(helper, /const shadowRoot = openShadowRoot\(node\)/);
  assert.match(helper, /return Object\.freeze\(roots\)/);
  assert.match(controller, /ownDataValue\(shadowRoots, "collectOpenShadowRoots"\)/);
  assert.match(controller, /const root = currentDocumentElement\(\)/);
  assert.match(controller, /Reflect\.apply\(collectOpenShadowRoots, undefined, \[root\]\)/);
  assert.match(controller, /for \(const shadowRoot of roots\)/);
  assert.match(controller, /if \(!observeTargetOnce\(shadowRoot\)\) return false/);
  for (const manifest of [chromium, firefox]) {
    const entry = manifest.content_scripts.find((item) => item.js?.includes("content/cookie-banner-controller.js"));
    assert.deepEqual(entry.js, CANONICAL_COOKIE_SCRIPTS);
    assert.equal(entry.all_frames, false);
  }
});
