import test from "node:test";
import assert from "node:assert/strict";
import {
  cloneQualificationJsonData,
  stringifyQualificationJsonData
} from "../tools/qualification-json-data.mjs";

test("qualification JSON sanitizer rejects toJSON/accessor objects without executing hooks", () => {
  let reads = 0;
  const value = { schemaVersion: 3 };
  Object.defineProperty(value, "toJSON", {
    enumerable: true,
    get() {
      reads += 1;
      return () => ({ schemaVersion: 999 });
    }
  });

  assert.throws(() => stringifyQualificationJsonData(value), /enumerable data field/);
  assert.equal(reads, 0);
});

test("qualification JSON sanitizer rejects unsupported prototypes", () => {
  assert.throws(
    () => cloneQualificationJsonData(new Date()),
    /plain data object/
  );
});

test("qualification JSON serialization is deterministic pretty JSON with final newline", () => {
  const value = {
    schemaVersion: 3,
    browser: { status: "PASS", notes: "" }
  };
  assert.equal(
    stringifyQualificationJsonData(value),
    '{\n  "schemaVersion": 3,\n  "browser": {\n    "status": "PASS",\n    "notes": ""\n  }\n}\n'
  );
});
