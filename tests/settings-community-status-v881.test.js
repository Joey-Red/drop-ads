import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/options/community-ui.js", import.meta.url), "utf8");

test("community contribution owns one polite atomic page-local status", () => {
  assert.match(source, /status\.id = "community-status"/);
  assert.match(source, /status\.setAttribute\("role", "status"\)/);
  assert.match(source, /status\.setAttribute\("aria-live", "polite"\)/);
  assert.match(source, /status\.setAttribute\("aria-atomic", "true"\)/);
  assert.match(source, /appendDescription\(autoSubmit, "community-status"\)/);
  assert.match(source, /appendDescription\(action, "community-status"\)/);
  assert.doesNotMatch(source, /localStorage|sessionStorage|indexedDB|sendBeacon|WebSocket/);
});
