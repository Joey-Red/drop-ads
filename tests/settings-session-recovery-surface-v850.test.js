import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/options/session-pauses.js", import.meta.url), "utf8");

test("M850 exposes deterministic privacy-minimal temporary session recovery", () => {
  assert.match(source, /navLink\.href = "#session-pauses-settings"/);
  assert.match(source, /section\.id = "session-pauses-settings"/);
  assert.match(source, /Sites paused from the toolbar appear here until the browser session ends/);
  assert.match(source, /does not record visited pages, requests, timestamps, statistics, or identifiers/);
  assert.match(source, /const domains = fixedCodeUnitSort\(session\.disabledSites\)/);
  assert.match(source, /No temporary session pauses/);
  assert.doesNotMatch(source, /localStorage|indexedDB|sendBeacon|analytics|telemetry/);
});
