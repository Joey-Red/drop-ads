import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const safety = fs.readFileSync(new URL("../src/content/cookie-banner-action-semantics-safety.js", import.meta.url), "utf8");

test("M996 refuses aria-controls action semantics", () => {
  assert.match(safety, /function controlledRegionSemanticsSafe\(element\)/);
  assert.match(safety, /elementHasAttribute\(element, "aria-controls"\)/);
  assert.match(safety, /return present !== null && !present/);
  assert.match(safety, /!controlledRegionSemanticsSafe\(element\)/);
});
