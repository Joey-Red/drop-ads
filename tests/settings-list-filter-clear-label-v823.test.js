import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/options/list-filter.js", import.meta.url), "utf8");

test("M823 Clear actions keep concise text and distinct accessible names", () => {
  assert.match(source, /clear\.textContent = "Clear"/);
  assert.match(source, /clear\.setAttribute\("aria-label", `Clear \$\{spec\.label\.toLowerCase\(\)\}`\)/);
  assert.match(source, /clear\.setAttribute\("aria-controls", spec\.listId\)/);
  assert.match(source, /clear\.setAttribute\("aria-describedby", `\$\{status\.id\} \$\{privacy\.id\}`\)/);
});
