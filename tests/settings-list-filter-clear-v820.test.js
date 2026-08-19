import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/options/list-filter.js", import.meta.url), "utf8");

test("Settings list filters provide Clear and Escape recovery", () => {
  assert.match(source, /const clearFilter = \(\) => \{/);
  assert.match(source, /input\.value = "";/);
  assert.match(source, /applyFilter\(controller\);/);
  assert.match(source, /input\.focus\(\);/);
  assert.match(source, /event\.key === "Escape" && input\.value/);
  assert.match(source, /event\.preventDefault\(\);/);
  assert.match(source, /clear\.addEventListener\("click", clearFilter\)/);
  assert.match(source, /controller\.clear\.disabled = !controller\.input\.value/);
});
