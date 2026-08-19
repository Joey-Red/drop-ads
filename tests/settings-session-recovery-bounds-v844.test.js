import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const ui = fs.readFileSync(new URL("../src/options/session-pauses.js", import.meta.url), "utf8");
const core = fs.readFileSync(new URL("../src/core/session.js", import.meta.url), "utf8");

test("M844 session recovery renders only normalized bounded state in deterministic order", () => {
  assert.match(ui, /const session = await loadSessionState\(api\)/);
  assert.match(ui, /const domains = fixedCodeUnitSort\(session\.disabledSites\)/);
  assert.match(ui, /return \[\.\.\.values\]\.sort\(\(left, right\) => left < right \? -1 : left > right \? 1 : 0\)/);
  assert.match(ui, /No temporary session pauses/);
  assert.match(ui, /does not record visited pages, requests, timestamps, statistics, or identifiers/);
  assert.match(core, /snapshotDenseDataArray\([\s\S]*LIVE_STATE_LIMITS\.domains/);
  assert.match(core, /return Object\.freeze\(\{ disabledSites: normalizeDomainSet\(disabledSites\) \}\)/);
});
