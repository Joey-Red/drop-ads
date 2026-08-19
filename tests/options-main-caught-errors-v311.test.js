import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/options/options.js", import.meta.url), "utf8");

test("main Settings routes caught exceptions through the bounded helper", () => {
  assert.match(source, /optionsCaughtErrorMessage/);
  assert.doesNotMatch(source, /error\s+instanceof\s+Error\s*\?\s*error\.message/);
  assert.doesNotMatch(source, /\.textContent\s*=\s*error\.message/);
});

test("main Settings contains startup and storage rerender failures", () => {
  assert.match(source, /await render\(\)\.catch\(\(error\) => \{/);
  assert.match(source, /optionsCaughtErrorMessage\(error, "Could not load Settings"\)/);
  assert.match(source, /void render\(\)\.catch\(\(error\) => \{/);
  assert.match(source, /optionsCaughtErrorMessage\(error, "Could not refresh Settings"\)/);
});
