import assert from "node:assert/strict";
import test from "node:test";
import { serializeQualificationRecord } from "../tools/qualification-record.mjs";

function validRecord() {
  return {
    schemaVersion: 4,
    package: { name: "drop-ads", version: "0.1.0" },
    commit: "a".repeat(40),
    sourceFingerprint: `sha256:${"b".repeat(64)}`,
    artifacts: {
      chromium: { file: "drop-ads-0.1.0-chromium.zip", bytes: 1, sha256: "c".repeat(64) },
      firefox: { file: "drop-ads-0.1.0-firefox.xpi", bytes: 1, sha256: "d".repeat(64) }
    },
    toolchain: { node: "22.0.0", npm: "10.0.0" }
  };
}

test("qualification record serialization is deterministic and newline-terminated", () => {
  const text = serializeQualificationRecord(validRecord());
  assert.ok(text.endsWith("\n"));
  assert.deepEqual(JSON.parse(text), validRecord());
});

test("qualification record serialization rejects accessors without executing them", () => {
  const record = validRecord();
  let calls = 0;
  Object.defineProperty(record.package, "name", {
    enumerable: true,
    get() {
      calls += 1;
      return "drop-ads";
    }
  });
  assert.throws(() => serializeQualificationRecord(record), /data field/);
  assert.equal(calls, 0);
});

test("qualification record serialization rejects toJSON hooks", () => {
  const record = validRecord();
  Object.defineProperty(record, "toJSON", { value: () => ({}) });
  assert.throws(() => serializeQualificationRecord(record), /fields are invalid/);
});
