import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/options/list-filter.js", import.meta.url), "utf8");

test("Escape returns focus from a filtered row to its local filter", () => {
  assert.match(source, /const onListKeyDown = \(event\) => \{/);
  assert.match(source, /event\.key !== "Escape" \|\| !normalizedQuery\(input\.value\)/);
  assert.match(source, /input\.focus\(\)/);
  assert.match(source, /list\.addEventListener\("keydown", onListKeyDown, true\)/);
  assert.match(source, /list\.removeEventListener\("keydown", controller\.onListKeyDown, true\)/);
});
