import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/options/list-filter-ergonomics.js", import.meta.url), "utf8");

test("global list-filter status is generic and privacy-minimal", () => {
  assert.match(source, /One or more list filters are active\./);
  assert.match(source, /role", "status"/);
  assert.match(source, /aria-live", "polite"/);
  assert.match(source, /clearAll\.setAttribute\("aria-describedby", status\.id\)/);
  assert.doesNotMatch(source, /match count|query text|filterInputs\.map|JSON\.stringify|localStorage|sessionStorage|indexedDB/);
});
