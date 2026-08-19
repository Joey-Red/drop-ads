import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const observation = fs.readFileSync(new URL("./cookie-banner-shadow-observation-v924.test.js", import.meta.url), "utf8");
const resync = fs.readFileSync(new URL("./cookie-banner-shadow-resync-v925.test.js", import.meta.url), "utf8");

test("M1037 keeps historical shadow regressions aligned with the current runtime", () => {
  assert.match(observation, /cookie-banner-utils-composition\.js/);
  assert.match(observation, /cookie-banner-action-source-safety\.js/);
  assert.match(observation, /cookie-banner-consent-safety\.js/);
  assert.match(observation, /captureGetter\\\(ElementPrototype, "shadowRoot"/);
  assert.match(observation, /Reflect\\\.apply\\\(collectOpenShadowRoots/);
  assert.match(resync, /ownDataValue\\\(shadowRoots, "collectOpenShadowRoots"/);
  assert.match(resync, /observeTargetOnce/);
});
