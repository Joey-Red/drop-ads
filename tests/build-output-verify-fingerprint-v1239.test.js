import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const source = await readFile(new URL("../tools/build-output-verify.mjs", import.meta.url), "utf8");

test("M1239 requires canonical sha256-prefixed lowercase verification fingerprints", () => {
  assert.match(source, /SOURCE_FINGERPRINT_PATTERN = \/\^sha256:\[0-9a-f\]\{64\}\$\//);
  assert.match(source, /function assertVerificationSourceFingerprint\(value, label\)/);
  assert.match(source, /must be canonical sha256:-prefixed lowercase SHA-256 text/);
  assert.match(source, /const fingerprint = assertVerificationSourceFingerprint\(sourceFingerprint, `\$\{target\} verification source fingerprint`\)/);
  assert.match(source, /const fingerprint = assertVerificationSourceFingerprint\(sourceFingerprint, "Shared verification source fingerprint"\)/);
  assert.match(source, /chromium\.sourceFingerprint !== fingerprint \|\| firefox\.sourceFingerprint !== fingerprint/);
});
