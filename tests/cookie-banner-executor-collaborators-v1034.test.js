import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/content/cookie-banner-executor.js", import.meta.url), "utf8");

test("M1034 executor captures utility and consent collaborators once", () => {
  assert.match(source, /DropAdsCookieBannerUtilsComposition/);
  assert.match(source, /ownDataValue\(composition, "snapshotUtils"\)/);
  for (const key of ["snapshotCandidate", "findConsentContainer", "isButtonLike", "isDropAdsOwned", "textSnapshot", "rejectionScore"]) {
    assert.ok(source.includes(`ownDataValue(utils, "${key}")`), `missing captured ${key}`);
  }
  assert.match(source, /ownDataValue\(globalThis, "DropAdsCookieBannerConsentSafety"\)/);
  assert.match(source, /consentSafetyKeys\.length !== 1/);
  assert.match(source, /ownDataValue\(consentSafety, "isStrongConsentContainer"\)/);
  assert.doesNotMatch(source, /const utils = globalThis\.DropAdsCookieBannerUtils/);
});

test("M1034 preserves native activation revalidation and immutable executor publication", () => {
  assert.match(source, /captureData\(HTMLElementPrototype, "click"\)/);
  assert.match(source, /captureData\(document, "elementFromPoint"\)/);
  assert.match(source, /if \(!hitTestOwnsAction\(snapshot\.element\)\) return false;/);
  assert.match(source, /Reflect\.apply\(nativeClick, snapshot\.element, \[\]\)/);
  assert.match(source, /Object\.defineProperty\(globalThis, EXECUTOR_GLOBAL/);
  assert.match(source, /writable: false/);
  assert.match(source, /configurable: false/);
  assert.doesNotMatch(source, /localStorage|sessionStorage|indexedDB|fetch\(|XMLHttpRequest|WebSocket|sendBeacon|analytics|telemetry/i);
});
