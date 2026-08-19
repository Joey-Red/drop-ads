import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/content/cookie-banner-consent-safety.js", import.meta.url), "utf8");

test("M1033 consent safety snapshots bounded consent context through composition", () => {
  assert.match(source, /DropAdsCookieBannerUtilsComposition/);
  assert.match(source, /ownDataValue\(composition, "snapshotUtils"\)/);
  assert.match(source, /Reflect\.apply\(snapshotUtils, composition, \[\]\)/);
  assert.match(source, /ownDataValue\(utils, "boundedConsentContext"\)/);
  assert.match(source, /Reflect\.apply\(boundedConsentContext, undefined, \[element\]\)/);
  assert.doesNotMatch(source, /globalThis\.DropAdsCookieBannerUtils\b/);
});

test("M1033 publishes an immutable consent-safety global and preserves evidence", () => {
  assert.match(source, /Object\.defineProperty\(globalThis, CONSENT_SAFETY_GLOBAL/);
  assert.match(source, /writable: false/);
  assert.match(source, /configurable: false/);
  for (const evidence of ["pliki cookie", "kakor", "privatlivsvalg", "informasjonskapsler", "evästeet", "soubory cookie"]) {
    assert.ok(source.includes(evidence), `missing localized evidence ${evidence}`);
  }
  assert.doesNotMatch(source, /localStorage|sessionStorage|indexedDB|fetch\(|XMLHttpRequest|WebSocket|sendBeacon|analytics|telemetry|navigator\.language|navigator\.languages/i);
});
