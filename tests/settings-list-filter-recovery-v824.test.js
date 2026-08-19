import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/options/list-filter.js", import.meta.url), "utf8");

test("M824 local filters expose clear and keyboard recovery", () => {
  assert.match(source, /clear\.textContent = "Clear"/);
  assert.match(source, /controller\.clear\.disabled = !controller\.input\.value/);
  assert.match(source, /input\.setAttribute\("aria-keyshortcuts", "Escape ArrowDown"\)/);
  assert.match(source, /event\.key === "Escape" && input\.value/);
  assert.match(source, /input\.focus\(\)/);
  assert.match(source, /removeEventListener\("keydown", controller\.onKeyDown\)/);
});
