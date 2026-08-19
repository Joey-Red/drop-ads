import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/options/list-filter.js", import.meta.url), "utf8");

test("M811 Settings recovery list filters remain transient, bounded, and keyboard recoverable", () => {
  for (const marker of [
    '{ listId: "block-list", label: "Filter personal block rules" }',
    '{ listId: "allow-list", label: "Filter personal allow rules" }',
    '{ listId: "disabled-sites", label: "Filter disabled sites" }',
    '{ listId: "cookie-exception-list", label: "Filter cookie exceptions" }'
  ]) {
    assert.ok(source.includes(marker), `missing canonical recovery filter: ${marker}`);
  }

  assert.ok(source.includes("const FILTER_QUERY_LIMIT = 256;"), "filter query must stay bounded");
  assert.ok(source.includes('input.setAttribute("aria-controls", spec.listId);'), "filter must expose its controlled list");
  assert.ok(source.includes('input.setAttribute("aria-keyshortcuts", "Escape ArrowDown");'), "filter keyboard recovery metadata must remain explicit");
  assert.ok(source.includes('if (event.key === "Escape" && input.value)'), "Escape must clear an active filter");
  assert.ok(source.includes('if (event.key !== "Escape" || !normalizedQuery(input.value) || !list.contains(event.target)) return;'), "Escape from a filtered row must return to the filter");
  assert.ok(source.includes("input.focus();"), "filter recovery must restore keyboard focus");
  assert.ok(source.includes("new globalThis.MutationObserver"), "filter must track committed list presentation changes");
  assert.ok(source.includes("controller.observer?.disconnect();"), "filter observer must be disposed on teardown");

  assert.doesNotMatch(source, /localStorage|sessionStorage|storage\.|fetch\s*\(|sendMessage|history\./i);
});
