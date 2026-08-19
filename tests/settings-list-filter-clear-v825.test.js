import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/options/list-filter.js", import.meta.url), "utf8");

test("M825 transient list filters share deterministic keyboard/Clear recovery", () => {
  assert.match(source, /clear\.type = "button";/);
  assert.match(source, /clear\.className = "list-filter-clear";/);
  assert.match(source, /clear\.textContent = "Clear";/);
  assert.match(source, /clear\.setAttribute\("aria-label", `Clear \$\{spec\.label\.toLowerCase\(\)\}`\)/);
  assert.match(source, /clear\.setAttribute\("aria-controls", spec\.listId\)/);
  assert.match(source, /input\.setAttribute\("aria-keyshortcuts", "Escape ArrowDown"\)/);
  assert.match(source, /controller\.clear\.disabled = !controller\.input\.value;/);
  assert.match(source, /input\.value = "";\n    controller\.pendingMutationFocus = null;\n    applyFilter\(controller\);\n    input\.focus\(\);/);
  assert.match(source, /event\.key === "Escape" && input\.value/);
  assert.match(source, /if \(event\.key === "ArrowDown" && focusFirstVisibleRowControl\(controller\)\) event\.preventDefault\(\);/);
  assert.match(source, /clear\.addEventListener\("click", clearFilter\)/);
  assert.match(source, /controller\.clear\.removeEventListener\("click", controller\.clearFilter\)/);
  assert.doesNotMatch(source, /saveState|storage\.|localStorage|sessionStorage|fetch\(/);
});
