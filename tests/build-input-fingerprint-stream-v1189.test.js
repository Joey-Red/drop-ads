import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { createHash } from "node:crypto";
import { fingerprintBuildInputs } from "../tools/build-info.mjs";

const source = fs.readFileSync(new URL("../tools/build-info.mjs", import.meta.url), "utf8");

test("M1189 incremental fingerprint stays byte-compatible with canonical JSON", () => {
  const inputs = [
    { path: "src/z.js", bytes: 2, sha256: "b".repeat(64) },
    { path: "src/a.js", bytes: 1, sha256: "a".repeat(64) }
  ];
  const canonical = [...inputs].sort((a, b) => a.path < b.path ? -1 : a.path > b.path ? 1 : 0);
  const expected = createHash("sha256").update(JSON.stringify(canonical), "utf8").digest("hex");
  assert.equal(fingerprintBuildInputs(inputs), expected);
});

test("M1189 bounds canonical fingerprint bytes without whole-array JSON Buffer allocation", () => {
  assert.match(source, /MAX_BUILD_FINGERPRINT_CANONICAL_BYTES = BUILD_INFO_MAX_BYTES/);
  assert.match(source, /canonicalBytes > MAX_BUILD_FINGERPRINT_CANONICAL_BYTES/);
  assert.match(source, /updateCanonical\("\["\)/);
  assert.match(source, /JSON\.stringify\(canonical\[index\]\)/);
  assert.match(source, /updateCanonical\("\]"\)/);
  assert.doesNotMatch(source, /Buffer\.from\(JSON\.stringify\(canonical\)/);
  assert.doesNotMatch(source, /JSON\.stringify\(canonical\)\s*,\s*"utf8"/);
});
