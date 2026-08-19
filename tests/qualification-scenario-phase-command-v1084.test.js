import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../tools/qualification-scenario-command.mjs", import.meta.url), "utf8");

test("M1084 qualify:scenario supports exact optional phase selection", () => {
  assert.match(source, /argv\.length !== 1 && argv\.length !== 3/);
  assert.match(source, /argv\[1\] !== "--phase"/);
  assert.match(source, /cookieBannerQualificationPhase\(argv\[2\]\)/);
  assert.match(source, /id !== "cookie-banner-rejection"/);
  assert.match(source, /guidance\.phases\.includes\(phase\.id\)/);
  assert.match(source, /schemaVersion: 1, scenario: id, phase/);
});

test("M1084 keeps the original one-argument output and source-only boundary", () => {
  assert.match(source, /if \(argv\.length === 1\) return Object\.freeze\(\{ schemaVersion: 1, scenario: id, guidance \}\)/);
  assert.doesNotMatch(source, /qualification-observation|qualification-record|process\.env|os\.|hostname|username|Date\.|fetch\(|XMLHttpRequest|WebSocket|sendBeacon|telemetry|analytics/i);
});
