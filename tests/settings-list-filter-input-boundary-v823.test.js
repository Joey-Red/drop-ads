import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/options/list-filter.js", import.meta.url), "utf8");

test("Settings list-filter input is bounded, locale-stable, and correction-safe", () => {
  assert.match(source, /const FILTER_QUERY_LIMIT = 256/);
  assert.match(source, /typeof value === "string" \? value : ""/);
  assert.match(source, /slice\(0, FILTER_QUERY_LIMIT\)\.trim\(\)\.toLowerCase\(\)/);
  assert.doesNotMatch(source, /toLocaleLowerCase/);
  assert.match(source, /input\.maxLength = FILTER_QUERY_LIMIT/);
  assert.match(source, /input\.autocapitalize = "none"/);
  assert.match(source, /input\.autocorrect = "off"/);
  assert.match(source, /input\.spellcheck = false/);
  assert.match(source, /input\.inputMode = "search"/);
  assert.match(source, /input\.enterKeyHint = "search"/);
  assert.doesNotMatch(source, /localStorage|sessionStorage|history\.|fetch\(/);
});
