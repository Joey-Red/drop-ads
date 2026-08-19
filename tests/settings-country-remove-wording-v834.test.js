import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/options/policy-row-semantics.js", import.meta.url), "utf8");

test("country rows expose explicit visible removal wording", () => {
  assert.match(source, /remove\.textContent = "Remove country block"/);
  assert.match(source, /`Remove country block \$\{labelText\}`/);
  assert.match(source, /remove\.setAttribute\("aria-describedby", `\$\{noteId\} country-status`\)/);
});
