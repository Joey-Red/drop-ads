import test from "node:test";
import assert from "node:assert/strict";
import { assertGeneratedEntryName, validateGeneratedEntry } from "../tools/artifact-audit.mjs";

test("M1228 generated path validation rejects coercible objects without invoking coercion hooks", () => {
  let coercions = 0;
  const hostile = {
    toString() {
      coercions += 1;
      return "background.js";
    },
    [Symbol.toPrimitive]() {
      coercions += 1;
      return "background.js";
    }
  };

  assert.throws(() => validateGeneratedEntry(hostile, "file", "chromium"), /must be text/);
  assert.equal(coercions, 0);
});

test("M1228 generated directory-entry validation rejects coercible objects without invoking hooks", () => {
  let coercions = 0;
  const hostile = {
    toString() {
      coercions += 1;
      return "core";
    }
  };

  assert.throws(() => assertGeneratedEntryName(hostile, "firefox"), /must be text/);
  assert.equal(coercions, 0);
});

test("M1228 preserves well-formed NFC and control-text rejection", () => {
  assert.throws(() => validateGeneratedEntry("e\u0301.js", "file", "chromium"), /must use NFC Unicode/);
  assert.throws(() => assertGeneratedEntryName("bad\u202ename", "firefox"), /forbidden control text/);
});
