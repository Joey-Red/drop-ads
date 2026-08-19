import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../tools/cookie-banner-action-source-qualification-server.mjs", import.meta.url), "utf8");

test("M980 fixture includes isolated M972-M978 unsafe action-identity routes", () => {
  for (const route of [
    "/direct-channel-conflict",
    "/labelledby-interactive-descendant",
    "/dropads-descendant",
    "/interactive-descendant",
    "/hidden-text",
    "/invisible-format",
    "/mixed-script"
  ]) assert.ok(source.includes(route), `fixture is missing ${route}`);
  assert.match(source, /value="Reject all" aria-label="Accept all"/);
  assert.match(source, /data-drop-ads-extension/);
  assert.match(source, /role="link">Reject all/);
  assert.match(source, /<span hidden>Reject all<\/span>/);
  assert.match(source, /Reject all\\u2066/);
  assert.match(source, /Reject all 接受/);
});

test("M980 fixture remains loopback-only and observation-free", () => {
  assert.match(source, /const HOST = "127\.0\.0\.1";/);
  assert.match(source, /const MAX_CONNECTIONS = 16;/);
  assert.match(source, /\["GET", "HEAD"\]/);
  assert.doesNotMatch(source, /fetch\(|XMLHttpRequest|WebSocket|sendBeacon|analytics|telemetry|localStorage|sessionStorage|indexedDB/i);
});
