import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/options/form-state-semantics.js", import.meta.url), "utf8");

test("M801 external-list edits clear stale transaction feedback through the canonical helper", () => {
  assert.match(source, /\["#subscription-error", \[\["#subscription-url", "input"\], \["#subscription-format", "change"\]\]\]/);
  assert.match(source, /function ownClearOnEdit\(errorSelector, entries\)/);
  assert.match(source, /if \(textContent\(errorNode\)\) errorNode\.textContent = ""/);
  assert.match(source, /ownListener\(document\.querySelector\(selector\), eventName, clear\)/);
  assert.match(source, /removeEventListener\(eventName, listener\)/);
});
