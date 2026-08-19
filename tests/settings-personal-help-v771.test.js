import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const source = fs.readFileSync(new URL("../src/options/ui-semantics.js", import.meta.url), "utf8");

test("personal block and allow controls inherit section guidance", () => {
  assert.match(source, /"block-help"/);
  assert.match(source, /"allow-help"/);
  assert.match(source, /appendDescription\(document\.querySelector\(selector\), helpId\)/);
  assert.match(source, /new Set\(\(control\.getAttribute\("aria-describedby"\)/);
});
