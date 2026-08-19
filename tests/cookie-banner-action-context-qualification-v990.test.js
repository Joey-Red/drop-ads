import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const server = fs.readFileSync(new URL("../tools/cookie-banner-action-source-qualification-server.mjs", import.meta.url), "utf8");

test("loopback action-source fixture includes M982-M988 context routes", () => {
  for (const route of [
    "/secondary-label-ancestor",
    "/editable-ancestor",
    "/editable-descendant",
    "/editable-labelledby",
    "/aria-haspopup",
    "/toggle-semantics",
    "/popover-target"
  ]) assert.ok(server.includes(route), `qualification fixture is missing ${route}`);
  assert.match(server, /const HOST = "127\.0\.0\.1"/);
  assert.match(server, /MAX_REQUEST_URL_CHARS = 2048/);
  assert.match(server, /MAX_CONNECTIONS = 16/);
  assert.doesNotMatch(server, /fetch\(|XMLHttpRequest|WebSocket|sendBeacon|analytics|telemetry/i);
});
