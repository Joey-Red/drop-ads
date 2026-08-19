import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const ui = fs.readFileSync(new URL("../src/options/session-pauses.js", import.meta.url), "utf8");
const core = fs.readFileSync(new URL("../src/core/session.js", import.meta.url), "utf8");

test("M851 Resume all uses bounded normalized state and deterministic order", () => {
  assert.match(core, /snapshotDenseDataArray\([\s\S]*LIVE_STATE_LIMITS\.domains/);
  assert.match(ui, /const domains = fixedCodeUnitSort\(session\.disabledSites\);/);
  assert.match(ui, /for \(const domain of domains\)/);
  assert.match(ui, /bulkRecoveryActive = true/);
  assert.match(ui, /syncRecoveryControls\(\)/);
  assert.match(ui, /Some temporary pauses could not be resumed/);
  assert.match(ui, /Protection resumed for all temporarily paused sites/);
  assert.doesNotMatch(ui, /status\.textContent = `[^`]*\$\{domain\}/);
});
