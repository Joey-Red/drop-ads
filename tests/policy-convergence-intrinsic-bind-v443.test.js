import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/policy-convergence.js", import.meta.url), "utf8");

test("policy convergence receiver binding never reads callable .bind", () => {
  assert.match(source, /function receiverCall\(callback, receiver\) \{\s*return \(\.\.\.args\) => Reflect\.apply\(callback, receiver, args\);\s*\}/s);
  assert.match(source, /return receiverCall\(descriptor\.value, receiver\);/);
  assert.match(source, /return receiverCall\(errorField\.value, loggerField\.value\);/);
  assert.match(source, /const syncRules = receiverCall\(syncField\.value, controller\);/);
  assert.doesNotMatch(source, /\.bind\(/);
});
