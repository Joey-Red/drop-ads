import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const source = fs.readFileSync(new URL("../src/options/dynamic-list-semantics.js", import.meta.url), "utf8");

test("personal rule removal actions are explicit", () => {
  assert.match(source, /remove\.textContent = "Remove rule"/);
  assert.match(source, /remove\.setAttribute\("aria-label", `Remove \$\{labelText\}`\)/);
});
