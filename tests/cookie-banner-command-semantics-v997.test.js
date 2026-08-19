import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const safety = fs.readFileSync(new URL("../src/content/cookie-banner-action-semantics-safety.js", import.meta.url), "utf8");

test("M997 refuses declarative command and invocation attributes", () => {
  assert.match(safety, /DECLARATIVE_COMMAND_ATTRIBUTES = Object\.freeze\(\["command", "commandfor", "invokeaction", "invoketarget"\]\)/);
  assert.match(safety, /function declarativeCommandSemanticsSafe\(element\)/);
  assert.match(safety, /elementHasAttribute\(element, attribute\)/);
  assert.match(safety, /if \(present === null \|\| present\) return false/);
  assert.match(safety, /!declarativeCommandSemanticsSafe\(element\)/);
});
