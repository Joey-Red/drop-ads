import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/options/list-filter.js", import.meta.url), "utf8");

test("personal and recovery filters are labelled local list controllers", () => {
  for (const [id, label] of [
    ["block-list", "Filter personal block rules"],
    ["allow-list", "Filter personal allow rules"],
    ["disabled-sites", "Filter disabled sites"],
    ["cookie-exception-list", "Filter cookie exceptions"]
  ]) {
    assert.match(source, new RegExp(`listId: "${id}", label: "${label}"`));
  }
  assert.match(source, /input\.setAttribute\("aria-controls", spec\.listId\);/);
  assert.match(source, /row\.hidden = !matches;/);
});
