import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/core/background-bootstrap.js", import.meta.url), "utf8");

test("optional registration teardown uses intrinsic Map operations", () => {
  assert.match(source, /Reflect\.apply\(Map\.prototype\.set, registrations, \[name, registration\]\)/);
  assert.match(source, /Reflect\.apply\(Map\.prototype\.entries, registrations, \[\]\)/);
  assert.match(source, /Reflect\.apply\(Map\.prototype\.clear, registrations, \[\]\)/);
  assert.doesNotMatch(source, /\[\.\.\.optionalRegistrations\.entries\(\)\]/);
  assert.doesNotMatch(source, /optionalRegistrations\.clear\(\)/);
});

test("optional registrations retain captured disposer records rather than caller objects", () => {
  assert.match(source, /const disposable = captureOptionalDisposer\(registration\);/);
  assert.match(source, /storeRegistration\(registrations, feature\.name, disposable\)/);
  assert.match(source, /return dispose \? Object\.freeze\(\{ dispose \}\) : null;/);
});
