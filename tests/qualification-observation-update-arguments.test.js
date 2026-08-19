import test from "node:test";
import assert from "node:assert/strict";
import { parseQualificationObservationUpdateArguments } from "../tools/qualification-observation-update.mjs";

test("qualification editor rejects duplicate and valueless browser flags", () => {
  assert.throws(
    () => parseQualificationObservationUpdateArguments(["browser", "chromium", "--version", "140", "--version", "141"]),
    /duplicate qualification observation option/
  );
  assert.throws(
    () => parseQualificationObservationUpdateArguments(["browser", "chromium", "--version", "--replace"]),
    /--version requires a value/
  );
  assert.throws(
    () => parseQualificationObservationUpdateArguments(["browser", "chromium", "--version", "140", "--replace", "--replace"]),
    /duplicate qualification observation option/
  );
});

test("qualification editor enforces version and note bounds", () => {
  assert.throws(
    () => parseQualificationObservationUpdateArguments(["browser", "firefox", "--version", "v".repeat(121)]),
    /browser version is invalid/
  );
  assert.throws(
    () => parseQualificationObservationUpdateArguments(["scenario", "startup-core", "firefox", "PASS", "--notes", "n".repeat(2001)]),
    /scenario notes is invalid/
  );
  assert.throws(
    () => parseQualificationObservationUpdateArguments(["scenario", "startup-core", "firefox", "PASS", "--notes", "one", "--notes", "two"]),
    /duplicate qualification observation option/
  );
});
