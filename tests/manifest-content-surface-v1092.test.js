import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const audit = fs.readFileSync(new URL("../tools/manifest-audit.mjs", import.meta.url), "utf8");
const contract = fs.readFileSync(new URL("../tools/manifest-content-contract.mjs", import.meta.url), "utf8");
const chromium = JSON.parse(fs.readFileSync(new URL("../manifests/chromium.json", import.meta.url), "utf8"));
const firefox = JSON.parse(fs.readFileSync(new URL("../manifests/firefox.json", import.meta.url), "utf8"));

test("M1092 manifest audit protects both reviewed content-script stacks", () => {
  assert.equal(chromium.content_scripts.length, 2);
  assert.deepEqual(firefox.content_scripts, chromium.content_scripts);
  for (const marker of [
    "content/picker-save-guard.js",
    "content/picker-ui.js",
    "content/cookie-banner-utils.js",
    "content/cookie-banner-utils-composition.js",
    "content/cookie-banner-locale-extension.js",
    "content/cookie-banner-action-semantics-safety.js",
    "content/cookie-banner-controller.js"
  ]) assert.ok(contract.includes(marker), `manifest contract missing ${marker}`);
  assert.match(contract, /all_frames: true/);
  assert.match(contract, /all_frames: false/);
});

test("M1092 preserves strict content-script order through the canonical contract", () => {
  assert.match(audit, /JSON\.stringify\(manifest\.content_scripts\) !== JSON\.stringify\(CANONICAL_CONTENT_SCRIPTS\)/);
  assert.match(audit, /picker\/cosmetic and cookie-banner runtime stacks/);
});
