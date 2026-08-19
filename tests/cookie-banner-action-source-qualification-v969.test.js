import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const fixture = fs.readFileSync(new URL("../tools/cookie-banner-action-source-qualification-server.mjs", import.meta.url), "utf8");

test("action-source qualification fixture is loopback-only and covers unsafe cases", () => {
  assert.match(fixture, /const HOST = "127\.0\.0\.1"/);
  assert.match(fixture, /const MAX_REQUEST_URL_CHARS = 2048/);
  assert.match(fixture, /const MAX_CONNECTIONS = 16/);
  for (const route of ["/control", "/direct-overflow", "/descendant-overflow", "/direct-visible-conflict", "/labelledby-conflict", "/navigation-ancestor"]) {
    assert.ok(fixture.includes(route), `missing fixture route ${route}`);
  }
  assert.match(fixture, /Cookie privacy choices/);
  assert.match(fixture, /PASS: safe control activated/);
  assert.match(fixture, /FAIL: oversized direct label activated/);
  assert.match(fixture, /FAIL: nested navigation action activated/);
  assert.doesNotMatch(fixture, /https:\/\/|fetch\(|XMLHttpRequest|WebSocket|sendBeacon|analytics|telemetry|localStorage|sessionStorage|indexedDB/i);
});
