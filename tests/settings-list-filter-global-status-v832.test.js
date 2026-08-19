import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/options/list-filter-ergonomics.js", import.meta.url), "utf8");

test("page-level list-filter status is generic and privacy-minimal", () => {
  assert.match(source, /status\.id = "list-filter-global-status"/);
  assert.match(source, /status\.setAttribute\("role", "status"\)/);
  assert.match(source, /const nextStatus = active \? "One or more list filters are active\." : ""/);
  assert.match(source, /clearAll\.setAttribute\("aria-describedby", status\.id\)/);
  assert.doesNotMatch(source, /match count|matches found|query history|localStorage|sessionStorage|fetch\(|sendMessage\(/i);
});
