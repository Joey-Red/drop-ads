import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const ui = fs.readFileSync(new URL("../src/options/session-pauses.js", import.meta.url), "utf8");
const core = fs.readFileSync(new URL("../src/core/session.js", import.meta.url), "utf8");

test("M855 recovery rendering stays normalized bounded deterministic and self-describing", () => {
  assert.match(ui, /const session = await loadSessionState\(api\)/);
  assert.match(ui, /const domains = fixedCodeUnitSort\(session\.disabledSites\)/);
  assert.match(ui, /No temporary session pauses/);
  assert.match(ui, /resume\.setAttribute\("aria-label", `Resume protection on \$\{domain\}`\)/);
  assert.match(ui, /resume\.setAttribute\("aria-controls", "session-pauses-list"\)/);
  assert.match(ui, /resume\.setAttribute\("aria-describedby", "session-pauses-help session-pauses-status"\)/);
  assert.match(core, /snapshotDenseDataArray\([\s\S]*LIVE_STATE_LIMITS\.domains/);
  assert.match(core, /return Object\.freeze\(\{ disabledSites: normalizeDomainSet\(disabledSites\) \}\)/);
});
