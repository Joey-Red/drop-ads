import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const server = fs.readFileSync(new URL("../tools/cookie-banner-action-source-qualification-server.mjs", import.meta.url), "utf8");

const routes = [
  "/disclosure-state",
  "/reset-action",
  "/native-role-override",
  "/busy-context",
  "/controlled-region",
  "/command-target"
];

test("M999 exposes isolated M992-M997 fail-closed routes beside the safe control", () => {
  assert.match(server, /"\/control"/);
  for (const route of routes) assert.ok(server.includes(`"${route}"`), `missing ${route}`);
  assert.match(server, /aria-expanded="false"/);
  assert.match(server, /type="reset"/);
  assert.match(server, /role="tab"/);
  assert.match(server, /aria-busy="true"/);
  assert.match(server, /aria-controls="prefs-panel"/);
  assert.match(server, /commandfor="prefs-panel"/);
});

test("M999 fixture remains bounded and loopback-only", () => {
  assert.match(server, /const HOST = "127\.0\.0\.1"/);
  assert.match(server, /const MAX_REQUEST_URL_CHARS = 2048/);
  assert.match(server, /const MAX_CONNECTIONS = 16/);
  assert.doesNotMatch(server, /fetch\(|XMLHttpRequest|WebSocket|sendBeacon|analytics|telemetry/i);
});
