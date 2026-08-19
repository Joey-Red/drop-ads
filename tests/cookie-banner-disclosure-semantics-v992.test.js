import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const safety = fs.readFileSync(new URL("../src/content/cookie-banner-action-semantics-safety.js", import.meta.url), "utf8");
const chromium = JSON.parse(fs.readFileSync(new URL("../manifests/chromium.json", import.meta.url), "utf8"));
const firefox = JSON.parse(fs.readFileSync(new URL("../manifests/firefox.json", import.meta.url), "utf8"));

function cookieEntry(manifest) {
  return manifest.content_scripts.find((entry) => entry.js?.includes("content/cookie-banner-controller.js"));
}

test("M992 refuses aria-expanded disclosure actions", () => {
  assert.match(safety, /function disclosureSemanticsSafe\(element\)/);
  assert.match(safety, /elementHasAttribute\(element, "aria-expanded"\)/);
  assert.match(safety, /!disclosureSemanticsSafe\(element\)/);
});

test("M992 semantics layer is loaded identically before executor capture", () => {
  const chromiumEntry = cookieEntry(chromium);
  const firefoxEntry = cookieEntry(firefox);
  assert.deepEqual(chromiumEntry, firefoxEntry);
  const semanticsIndex = chromiumEntry.js.indexOf("content/cookie-banner-action-semantics-safety.js");
  const executorIndex = chromiumEntry.js.indexOf("content/cookie-banner-executor.js");
  assert.ok(semanticsIndex >= 0 && semanticsIndex < executorIndex);
  assert.equal(chromiumEntry.all_frames, false);
});
