import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/options/subscription-presentation.js", import.meta.url), "utf8");

test("built-in filter lists explain disable-based recovery", () => {
  assert.match(source, /const removable = Boolean\(row\.querySelector\("button\.remove"\)\)/);
  assert.match(source, /Built-in source stays configured; turn Enabled off to stop using it\./);
  assert.match(source, /subscription-management-note/);
  assert.match(source, /if \(!removable\)/);
});
