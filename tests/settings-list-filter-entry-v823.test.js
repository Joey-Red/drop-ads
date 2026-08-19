import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/options/list-filter.js", import.meta.url), "utf8");

test("M823 keeps list-filter text entry bounded and correction-free", () => {
  assert.match(source, /const FILTER_QUERY_LIMIT = 256/);
  assert.match(source, /input\.maxLength = FILTER_QUERY_LIMIT/);
  assert.match(source, /input\.autocomplete = "off"/);
  assert.match(source, /input\.autocapitalize = "none"/);
  assert.match(source, /input\.autocorrect = "off"/);
  assert.match(source, /input\.spellcheck = false/);
  assert.match(source, /input\.inputMode = "search"/);
  assert.match(source, /input\.enterKeyHint = "search"/);
  assert.doesNotMatch(source, /localStorage|sessionStorage|fetch\(|XMLHttpRequest|telemetry|analytics/i);
});
