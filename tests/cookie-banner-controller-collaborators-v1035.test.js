import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/content/cookie-banner-controller.js", import.meta.url), "utf8");

test("M1035 controller snapshots exact cookie-banner collaborators", () => {
  assert.match(source, /DropAdsCookieBannerUtilsComposition/);
  for (const key of ["snapshotCandidateArray", "rejectionScore", "discoverActionCandidates"]) {
    assert.ok(source.includes(`ownDataValue(utils, "${key}")`), `missing utility collaborator ${key}`);
  }
  assert.match(source, /exactFrozenApi\("DropAdsCookieBannerExecutor"/);
  assert.match(source, /exactFrozenApi\("DropAdsCookieBannerShadowRoots"/);
  assert.match(source, /exactFrozenApi\("DropAdsCookieBannerConsentSafety"/);
  assert.match(source, /ownDataValue\(executor, "activateRejectionCandidate"\)/);
  assert.match(source, /ownDataValue\(shadowRoots, "collectOpenShadowRoots"\)/);
  assert.match(source, /ownDataValue\(consentSafety, "isStrongConsentContainer"\)/);
  assert.doesNotMatch(source, /const utils = globalThis\.DropAdsCookieBannerUtils/);
});

test("M1035 preserves bounded controller lifecycle and fail-closed scoring", () => {
  assert.match(source, /const MAX_SCAN_ATTEMPTS = 16;/);
  assert.match(source, /const MAX_OBSERVE_MS = 30_000;/);
  assert.match(source, /function selectUnambiguousCandidate\(candidates\)/);
  assert.match(source, /Number\.isSafeInteger\(score\)/);
  assert.match(source, /score < 0 \|\| score > 100/);
  assert.match(source, /addGlobalListener\("pagehide", stop, \{ once: true \}\)/);
  assert.doesNotMatch(source, /localStorage|sessionStorage|indexedDB|fetch\(|XMLHttpRequest|WebSocket|sendBeacon|analytics|telemetry/i);
});
