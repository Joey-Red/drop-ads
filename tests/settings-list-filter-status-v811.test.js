import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/options/list-filter.js", import.meta.url), "utf8");

test("list filters announce generic local state without query or count telemetry", () => {
  assert.match(source, /status\.setAttribute\("role", "status"\)/);
  assert.match(source, /status\.setAttribute\("aria-live", "polite"\)/);
  assert.match(source, /status\.setAttribute\("aria-atomic", "true"\)/);
  assert.match(source, /return hasMatches \? "Filter active" : "No matching entries"/);
  assert.doesNotMatch(source, /\$\{shown\}|\$\{total\}|status\.textContent\s*=\s*[^;]*(query|input\.value)/);
});
