import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/content/cookie-banner-action-context-safety.js", import.meta.url), "utf8");
const chromium = JSON.parse(fs.readFileSync(new URL("../manifests/chromium.json", import.meta.url), "utf8"));
const firefox = JSON.parse(fs.readFileSync(new URL("../manifests/firefox.json", import.meta.url), "utf8"));

function entry(manifest) {
  return manifest.content_scripts.find((candidate) => candidate.js?.includes("content/cookie-banner-controller.js"));
}

test("secondary activation ancestry fails closed with bounded composed traversal", () => {
  assert.match(source, /MAX_ACTIVATION_ANCESTOR_STEPS = 16/);
  assert.match(source, /\["a", "area", "button", "input", "select", "textarea", "option", "label", "summary"\]/);
  assert.match(source, /elementHasAttribute\(element, "href"\)/);
  assert.match(source, /elementHasAttribute\(element, "formaction"\)/);
  assert.match(source, /role === "button" \|\| role === "link"/);
  assert.match(source, /Reflect\.apply\(nativeShadowHostGetter, root, \[\]\)/);
  assert.match(source, /!activationAncestrySafe\(element\)/);
});

test("context safety layer is ordered identically in both manifests", () => {
  const chromiumEntry = entry(chromium);
  const firefoxEntry = entry(firefox);
  assert.deepEqual(chromiumEntry, firefoxEntry);
  const index = chromiumEntry.js.indexOf("content/cookie-banner-action-context-safety.js");
  assert.equal(chromiumEntry.js[index - 1], "content/cookie-banner-action-source-safety.js");
  assert.equal(chromiumEntry.js[index + 1], "content/cookie-banner-action-semantics-safety.js");
});
