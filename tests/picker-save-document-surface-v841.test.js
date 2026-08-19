import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const source = fs.readFileSync(new URL("../src/content/picker-save-guard.js", import.meta.url), "utf8");

test("picker save guard requires a live Document-like query surface", () => {
  assert.match(source, /function documentCanQuery\(documentRef\)/);
  assert.match(source, /documentRef\.nodeType === 9/);
  assert.match(source, /typeof documentRef\.querySelectorAll === "function"/);
  assert.match(source, /!documentCanQuery\(documentRef\) \|\| !targetBelongsToDocument/);
});
