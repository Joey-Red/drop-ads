import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/options/list-filter.js", import.meta.url), "utf8");

test("Settings list filtering stays bounded, local, and explicitly ephemeral", () => {
  assert.match(source, /const FILTER_QUERY_LIMIT = 256;/);
  assert.match(source, /Filters only this Settings page and is not saved\./);
  assert.match(source, /input\.maxLength = FILTER_QUERY_LIMIT/);
  assert.match(source, /input\.setAttribute\("aria-controls", spec\.listId\)/);
  assert.match(source, /privacy\.textContent = FILTER_PRIVACY_TEXT/);
  assert.match(source, /window\.addEventListener\("pagehide"/);
  assert.doesNotMatch(source, /localStorage|sessionStorage|storage\.|fetch\(|XMLHttpRequest|sendMessage|runtimePolicy|telemetry|analytics/i);
});
