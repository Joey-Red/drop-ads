import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const source = fs.readFileSync(new URL("../src/options/dynamic-list-semantics.js", import.meta.url), "utf8");

test("filter-list row controls reference source and transaction feedback", () => {
  assert.match(source, /controls\.setAttribute\("aria-describedby", `\$\{sourceId\} refresh-status subscription-error`\)/);
  assert.match(source, /checkbox\.setAttribute\("aria-describedby", `\$\{sourceId\} refresh-status subscription-error`\)/);
  assert.match(source, /remove\.setAttribute\("aria-describedby", `\$\{sourceId\} refresh-status subscription-error`\)/);
});
