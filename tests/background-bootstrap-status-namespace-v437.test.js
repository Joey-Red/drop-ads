import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/background-bootstrap.js", import.meta.url), "utf8");

test("optional feature status uses a null-prototype namespace", () => {
  assert.match(source, /const status = Object\.create\(null\);/);
  assert.match(source, /function setFeatureStatus\(status, name, value\)/);
  assert.match(source, /Object\.defineProperty\(status, name/);
  assert.match(source, /return Object\.freeze\(status\);/);
  assert.doesNotMatch(source, /const status = \{\};/);
});
