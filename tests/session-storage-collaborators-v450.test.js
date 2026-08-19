import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/session.js", import.meta.url), "utf8");

test("session persistence captures storage namespaces and methods through bounded data descriptors", () => {
  assert.match(source, /MAX_SESSION_COLLABORATOR_PROTOTYPE_DEPTH = 8/);
  assert.match(source, /captureSessionDataProperty\(api, "storage", "Session storage namespace", false\)/);
  assert.match(source, /captureSessionDataProperty\(storage, "session", "Session storage\.session namespace", false\)/);
  assert.match(source, /captureSessionMethod\(area, "get", "Session storage\.session\.get"\)/);
  assert.match(source, /captureSessionMethod\(area, "set", "Session storage\.session\.set"\)/);
  assert.doesNotMatch(source, /api\?\.storage\?\.session/);
  assert.doesNotMatch(source, /area\.get\(/);
  assert.doesNotMatch(source, /area\.set\(/);
});

test("session storage callbacks are invoked with the original receiver without callback-owned bind", () => {
  assert.match(source, /return \(\.\.\.args\) => Reflect\.apply\(callback, receiver, args\);/);
  assert.doesNotMatch(source, /callback\.bind\(/);
});
