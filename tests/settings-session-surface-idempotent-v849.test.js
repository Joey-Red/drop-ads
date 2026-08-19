import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const sessionSource = fs.readFileSync(new URL("../src/options/session-pauses.js", import.meta.url), "utf8");
const resetSource = fs.readFileSync(new URL("../src/options/reset-settings-ui.js", import.meta.url), "utf8");
const resetBoundary = fs.readFileSync(new URL("../src/core/settings-reset-response.js", import.meta.url), "utf8");

test("M849 reuses the first-class session recovery nav link and section", () => {
  assert.match(sessionSource, /function ensureSessionPauseNavLink\(\)/);
  assert.match(sessionSource, /querySelector\('a\[href="#session-pauses-settings"\]'\)/);
  assert.match(sessionSource, /if \(existing\) return existing;/);
  assert.match(sessionSource, /function ensureSessionPauseSection\(\)/);
  assert.match(sessionSource, /document\.querySelector\("#session-pauses-settings"\)/);
});

test("M850 provides bounded local Resume all recovery for temporary session pauses", () => {
  assert.match(sessionSource, /id="session-resume-all"/);
  assert.match(sessionSource, /async function resumeAllSessionPauses\(\)/);
  assert.match(sessionSource, /const domains = fixedCodeUnitSort\(session\.disabledSites\);/);
  assert.match(sessionSource, /type: "drop-ads:set-session-site-paused"/);
  assert.match(sessionSource, /paused: false/);
  assert.match(sessionSource, /bulkRecoveryActive = true/);
});

test("M851 exposes first-class configured reset recovery separate from session pauses", () => {
  assert.match(resetSource, /function ensureResetNavLink\(\)/);
  assert.match(resetSource, /querySelector\('a\[href="#reset-settings-section"\]'\)/);
  assert.match(resetSource, /document\.querySelector\("#reset-settings-section"\)/);
  assert.match(resetSource, /heading\.textContent = "Reset configured settings"/);
  assert.match(resetSource, /Temporary session pauses are separate ephemeral recovery state and are not cleared by this action/);
  assert.match(resetSource, /Drop Ads does not keep a reset history, browsing history, request history, statistics, identifiers, or telemetry/);
});

test("M852 validates configured reset responses with an exact control-safe boundary", () => {
  assert.match(resetSource, /unwrapSettingsResetResponse\(response, "Could not reset configured settings"\)/);
  assert.match(resetBoundary, /exactPlainObject\(response, expectedKeys, "Settings reset response"\)/);
  assert.match(resetBoundary, /exactPlainObject\(result, \["changed"\], "Settings reset result"\)/);
  assert.match(resetBoundary, /ownData\(result, "changed"\)\.value !== true/);
  assert.match(resetBoundary, /CONTROL_CHARACTERS/);
  assert.match(resetBoundary, /throw new Error\(safeErrorText\(error\) \? error : fallback\)/);
});
