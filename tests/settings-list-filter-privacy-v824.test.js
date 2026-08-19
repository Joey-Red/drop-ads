import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/options/list-filter.js", import.meta.url), "utf8");

test("list-filter feedback is generic, local, and non-persistent", () => {
  assert.match(source, /Filters only this Settings page and is not saved\./);
  assert.match(source, /return "No entries";/);
  assert.match(source, /return hasMatches \? "Filter active" : "No matching entries";/);
  assert.match(source, /input\.setAttribute\("aria-describedby", `\$\{status\.id\} \$\{privacy\.id\}`\);/);
  assert.doesNotMatch(source, /shown|total|analytics|telemetry|localStorage|sessionStorage|indexedDB/);
});
