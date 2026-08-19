import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import {
  MAX_BUILD_INPUT_DESCRIPTOR_AGGREGATE_BYTES,
  MAX_BUILD_INPUT_DESCRIPTOR_FILE_BYTES,
  snapshotBuildFingerprintInputs
} from "../tools/build-input-descriptor-safety.mjs";

const helper = fs.readFileSync(new URL("../tools/build-input-descriptor-safety.mjs", import.meta.url), "utf8");
const sha256 = "0".repeat(64);

function descriptor(index, bytes) {
  return { path: `src/member-${String(index).padStart(2, "0")}.js`, bytes, sha256 };
}

test("M1175 accepts the exact 256 MiB descriptor aggregate", () => {
  const entries = Array.from({ length: 16 }, (_, index) => descriptor(index, MAX_BUILD_INPUT_DESCRIPTOR_FILE_BYTES));
  const snapshot = snapshotBuildFingerprintInputs(entries);
  assert.equal(snapshot.length, 16);
  assert.equal(snapshot.reduce((total, entry) => total + entry.bytes, 0), MAX_BUILD_INPUT_DESCRIPTOR_AGGREGATE_BYTES);
});

test("M1175 rejects a self-consistent descriptor set above the real aggregate ceiling", () => {
  const entries = Array.from({ length: 16 }, (_, index) => descriptor(index, MAX_BUILD_INPUT_DESCRIPTOR_FILE_BYTES));
  entries.push(descriptor(16, 1));
  assert.throws(() => snapshotBuildFingerprintInputs(entries), /descriptor aggregate exceeds its byte ceiling/);
  assert.match(helper, /MAX_BUILD_INPUT_DESCRIPTOR_AGGREGATE_BYTES = 256 \* 1024 \* 1024/);
  assert.match(helper, /aggregateBytes > MAX_BUILD_INPUT_DESCRIPTOR_AGGREGATE_BYTES/);
});
