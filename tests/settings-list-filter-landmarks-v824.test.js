import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const html = fs.readFileSync(new URL("../src/options/index.html", import.meta.url), "utf8");
const source = fs.readFileSync(new URL("../src/options/list-filter-landmarks.js", import.meta.url), "utf8");

test("M824 exposes each generated list filter as a named local search region", () => {
  assert.match(html, /<script type="module" src="list-filter-landmarks\.js"><\/script>/);
  assert.match(source, /document\.querySelectorAll\("\.list-filter"\)/);
  assert.match(source, /filter\.setAttribute\("role", "search"\)/);
  assert.match(source, /filter\.setAttribute\("aria-labelledby", label\.id\)/);
  assert.match(source, /filter\.setAttribute\("aria-controls", listId\)/);
  assert.doesNotMatch(source, /storage|fetch\(|sendMessage|localStorage|sessionStorage|indexedDB/);
});
