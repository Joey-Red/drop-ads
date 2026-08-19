import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/options/session-pauses.js", import.meta.url), "utf8");

test("M849 Settings exposes privacy-minimal temporary session recovery", () => {
  assert.match(source, /navLink\.href = "#session-pauses-settings"/);
  assert.match(source, /section\.id = "session-pauses-settings"/);
  assert.match(source, /does not record visited pages, requests, timestamps, statistics, or identifiers/);
  assert.match(source, /const session = await loadSessionState\(api\);/);
  assert.match(source, /const domains = fixedCodeUnitSort\(session\.disabledSites\);/);
  assert.match(source, /item\.textContent = "No temporary session pauses"/);
  assert.match(source, /type: "drop-ads:set-session-site-paused"/);
  assert.match(source, /paused: false/);
});
