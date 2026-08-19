import test from "node:test";
import assert from "node:assert/strict";
import { assertGeneratedEntryName, validateGeneratedEntry } from "../tools/artifact-audit.mjs";

test("M1231 admits only well-formed NFC generated path text", () => {
  assert.equal(validateGeneratedEntry("manifest.json", "file", "chromium"), null);
  assert.equal(assertGeneratedEntryName("manifest.json", "chromium"), "manifest.json");

  for (const value of ["cafe\u0301.js", "bad\u202Ename.js", "bad\u200Bname.js", "bad\uFEFFname.js", "bad\uD800name.js"]) {
    assert.throws(() => validateGeneratedEntry(value, "file", "chromium"), TypeError);
    assert.throws(() => assertGeneratedEntryName(value, "chromium"), TypeError);
  }
});
