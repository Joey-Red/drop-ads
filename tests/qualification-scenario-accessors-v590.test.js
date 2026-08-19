import test from "node:test";
import assert from "node:assert/strict";
import {
  qualificationScenarioBrowserNotes,
  qualificationScenarioBrowserStatus
} from "../tools/qualification-scenarios.mjs";

test("status accessor reads strict legacy v2 and nested v3 results", () => {
  const v2 = { chromium: "PASS", firefox: "FAIL", notes: "legacy shared note" };
  const v3 = {
    chromium: { status: "N/A", notes: "chromium-only" },
    firefox: { status: "PASS", notes: "firefox-only" }
  };
  assert.equal(qualificationScenarioBrowserStatus(v2, "chromium"), "PASS");
  assert.equal(qualificationScenarioBrowserStatus(v2, "firefox"), "FAIL");
  assert.equal(qualificationScenarioBrowserStatus(v3, "chromium"), "N/A");
  assert.equal(qualificationScenarioBrowserStatus(v3, "firefox"), "PASS");
});

test("notes accessor never guesses legacy shared-note ownership", () => {
  const v2 = { chromium: "PASS", firefox: "UNOBSERVED", notes: "ambiguous shared note" };
  const v3 = {
    chromium: { status: "PASS", notes: "chromium-only" },
    firefox: { status: "FAIL", notes: "firefox-only" }
  };
  assert.equal(qualificationScenarioBrowserNotes(v2, "chromium"), "");
  assert.equal(qualificationScenarioBrowserNotes(v2, "firefox"), "");
  assert.equal(qualificationScenarioBrowserNotes(v3, "chromium"), "chromium-only");
  assert.equal(qualificationScenarioBrowserNotes(v3, "firefox"), "firefox-only");
});

test("accessors reject unsupported browsers and malformed result slots", () => {
  assert.throws(() => qualificationScenarioBrowserStatus({}, "chromium"), /invalid/);
  assert.throws(() => qualificationScenarioBrowserStatus({ chromium: "YES" }, "chromium"), /status is invalid/);
  assert.throws(() => qualificationScenarioBrowserStatus({ chromium: { status: "PASS" } }, "chromium"), /notes|invalid/);
  assert.throws(() => qualificationScenarioBrowserNotes({ chromium: { status: "PASS" } }, "chromium"), /notes|invalid/);
  assert.throws(() => qualificationScenarioBrowserStatus({ chromium: "PASS" }, "edge"), /chromium or firefox/);
});
