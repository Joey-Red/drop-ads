import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  MAX_BUILD_INPUT_DESCRIPTOR_FILE_BYTES,
  snapshotBuildFingerprintInputs
} from "../tools/build-input-descriptor-safety.mjs";

const buildInfo = fs.readFileSync(new URL("../tools/build-info.mjs", import.meta.url), "utf8");
const helper = fs.readFileSync(new URL("../tools/build-input-descriptor-safety.mjs", import.meta.url), "utf8");
const sha256 = "0".repeat(64);

test("M1174 accepts the exact per-file descriptor byte ceiling", () => {
  const [entry] = snapshotBuildFingerprintInputs([
    { path: "src/example.js", bytes: MAX_BUILD_INPUT_DESCRIPTOR_FILE_BYTES, sha256 }
  ]);
  assert.equal(entry.bytes, 16 * 1024 * 1024);
});

test("M1174 rejects a build-info descriptor above the real hash ceiling", () => {
  assert.throws(() => snapshotBuildFingerprintInputs([
    { path: "src/example.js", bytes: MAX_BUILD_INPUT_DESCRIPTOR_FILE_BYTES + 1, sha256 }
  ]), /bytes is invalid/);
  assert.match(helper, /values\.bytes > MAX_BUILD_INPUT_DESCRIPTOR_FILE_BYTES/);
  assert.match(buildInfo, /MAX_BUILD_INPUT_FILE_BYTES = MAX_BUILD_INPUT_DESCRIPTOR_FILE_BYTES/);
  assert.match(buildInfo, /"tools\/build-input-descriptor-safety\.mjs"/);
});
