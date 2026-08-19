import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/options/list-filter.js", import.meta.url), "utf8");

test("supporting ArrowDown coverage follows the current visible-row helper", () => {
  assert.match(source, /function visibleRows\(controller\)/);
  assert.match(source, /!row\.hidden && !row\.classList\.contains\("empty"\)/);
  assert.match(source, /function focusFirstVisibleRowControl\(controller\)/);
  assert.match(source, /button:not\(:disabled\), input:not\(:disabled\), select:not\(:disabled\)/);
  assert.match(source, /if \(event\.key === "ArrowDown" && focusFirstVisibleRowControl\(controller\)\) event\.preventDefault\(\);/);
  assert.doesNotMatch(source, /focusFirstVisibleRowControl[\s\S]{0,500}(saveState|sendMessage|fetch\(|storage\.)/);
});
