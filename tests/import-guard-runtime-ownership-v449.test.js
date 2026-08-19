import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/import-guard.js", import.meta.url), "utf8");

test("M449 import guard captures runtime event add/remove methods once", () => {
  assert.match(source, /const addRawListener = captureReceiverMethod\(rawOnMessage, "addListener", "Import guard runtime\.onMessage\.addListener"\);/);
  assert.match(source, /const removeRawListener = captureReceiverMethod\(rawOnMessage, "removeListener", "Import guard runtime\.onMessage\.removeListener", false\);/);
  assert.match(source, /wrappers\.set\(listener, wrapper\);\s*try \{\s*addRawListener\(wrapper\);/s);
  assert.match(source, /wrappers\.delete\(listener\);\s*if \(!removeRawListener\) return;\s*try \{ removeRawListener\(wrapper\); \}/s);
  assert.doesNotMatch(source, /rawOnMessage\.addListener\(/);
  assert.doesNotMatch(source, /rawOnMessage\.removeListener\(/);
});

test("M449 runtime forwarding uses Reflect.apply and never callback-owned bind", () => {
  assert.match(source, /return \(\.\.\.args\) => Reflect\.apply\(value, target, args\);/);
  assert.doesNotMatch(source, /value\.bind\(/);
});
