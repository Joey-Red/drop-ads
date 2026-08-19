import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const checklist = fs.readFileSync(new URL("../tools/qualification-cookie-banner-checklist.mjs", import.meta.url), "utf8");
const command = fs.readFileSync(new URL("../tools/qualification-scenario-command.mjs", import.meta.url), "utf8");

test("M1087 phases declare only canonical fixture ids", () => {
  assert.match(checklist, /fixtureIds: Object\.freeze\(\[\.\.\.fixtureIds\]\)/);
  for (const id of ["main-loopback", "action-source", "localization"]) {
    assert.ok(checklist.includes(`"${id}"`), `missing fixture id ${id}`);
  }
});

test("M1087 phase command resolves immutable fixture descriptors", () => {
  assert.match(command, /cookieBannerQualificationFixture/);
  assert.match(command, /phase\.fixtureIds\.map\(\(fixtureId\) => cookieBannerQualificationFixture\(fixtureId\)\)/);
  assert.match(command, /const fixtures = Object\.freeze/);
  assert.match(command, /schemaVersion: 1, scenario: id, phase, fixtures/);
  assert.doesNotMatch(command, /qualification-observation|qualification-record|process\.env|hostname|username|Date\.|fetch\(|XMLHttpRequest|WebSocket|sendBeacon|telemetry|analytics/i);
});
