import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/options/session-pauses.js", import.meta.url), "utf8");

test("M844 Settings can resume all temporary session pauses locally", () => {
  assert.match(source, /id="session-resume-all"[^>]*aria-controls="session-pauses-list"/);
  assert.match(source, /async function resumeAllSessionPauses\(\)/);
  assert.match(source, /const domains = fixedCodeUnitSort\(session\.disabledSites\);/);
  assert.match(source, /type: "drop-ads:set-session-site-paused",\s*domain,\s*paused: false/s);
  assert.match(source, /Some temporary pauses could not be resumed\./);
  assert.match(source, /Protection resumed for all temporarily paused sites\./);
  assert.doesNotMatch(source, /localStorage|sessionStorage|sendBeacon|XMLHttpRequest/);
});
