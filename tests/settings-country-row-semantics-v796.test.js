import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const helper = fs.readFileSync(new URL("../src/options/policy-row-semantics.js", import.meta.url), "utf8");
const loader = fs.readFileSync(new URL("../src/options/dynamic-list-semantics.js", import.meta.url), "utf8");

test("country rows expose visible TLD, scope, and status semantics", () => {
  assert.match(loader, /import "\.\/policy-row-semantics\.js"/);
  assert.match(helper, /controls\.setAttribute\("role", "group"\)/);
  assert.match(helper, /controls\.setAttribute\("aria-labelledby", labelId\)/);
  assert.match(helper, /controls\.setAttribute\("aria-describedby", `\$\{noteId\} country-status`\)/);
  assert.match(helper, /mode\.setAttribute\("aria-describedby", `\$\{noteId\} country-status`\)/);
  assert.match(helper, /remove\.setAttribute\("aria-describedby", `\$\{noteId\} country-status`\)/);
  assert.match(helper, /countryObserver\?\.disconnect\(\)/);
});
