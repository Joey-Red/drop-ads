import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../tools/build-output-verify.mjs", import.meta.url), "utf8");

test("M1238 supporting result contract remains frozen under canonical fingerprint publication", () => {
  assert.match(source, /function freezeVerificationBrowserResult\(browser, sourceFingerprint, files\)/);
  assert.match(source, /const frozenFiles = Object\.freeze\(/);
  assert.match(source, /return Object\.freeze\(\{ browser: target, sourceFingerprint: fingerprint, files: frozenFiles \}\)/);
  assert.match(source, /function freezeVerificationPairResult\(chromium, firefox, sourceFingerprint\)/);
  assert.match(source, /return Object\.freeze\(\{ chromium, firefox, sourceFingerprint: fingerprint \}\)/);
  assert.match(source, /return freezeVerificationBrowserResult\(browser, expected\.buildInfo\.sourceFingerprint/);
  assert.match(source, /return freezeVerificationPairResult\(chromium, firefox, sharedBuildInfo\.sourceFingerprint\)/);
});
