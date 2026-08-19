import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/background-bootstrap.js", import.meta.url), "utf8");

test("M455 optional registration maps use an intrinsic brand probe", () => {
  assert.match(source, /const MAP_BRAND_PROBE = Object\.freeze\(\{\}\);/);
  assert.match(source, /Map\.prototype\.has\.call\(value, MAP_BRAND_PROBE\)/);
  assert.doesNotMatch(source, /registrations instanceof Map/);
});

test("M455 registration bookkeeping uses intrinsic Map operations", () => {
  assert.match(source, /Reflect\.apply\(Map\.prototype\.set, registrations, \[name, registration\]\)/);
  assert.match(source, /Reflect\.apply\(Map\.prototype\.entries, registrations, \[\]\)/);
  assert.match(source, /Reflect\.apply\(Map\.prototype\.clear, registrations, \[\]\)/);
  assert.doesNotMatch(source, /registrations\.set\(/);
  assert.doesNotMatch(source, /registrations\.clear\(/);
});
