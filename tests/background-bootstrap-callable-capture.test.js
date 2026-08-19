import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/background-bootstrap.js", import.meta.url), "utf8");

test("bootstrap callback capture never relies on callback-owned bind", () => {
  assert.match(source, /function captureCallable\(callback, receiver, label\)/);
  assert.match(source, /Reflect\.apply\(callback, receiver, args\)/);
  assert.match(source, /return captureCallable\(warn\.value, logger/);
  assert.doesNotMatch(source, /callback\.bind\(/);
  assert.doesNotMatch(source, /warn\.value\.bind\(/);
});
