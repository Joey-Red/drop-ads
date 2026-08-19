import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const ui = fs.readFileSync(new URL("../src/content/picker-ui.js", import.meta.url), "utf8");

test("picker dialog is a deliberate programmatic focus entry", () => {
  assert.match(ui, /id="panel" role="dialog" tabindex="-1"/);
  assert.match(ui, /queueMicrotask\(\(\) => \{/);
  assert.match(ui, /if \(host\.isConnected !== true\) return;/);
  assert.match(ui, /panel\.focus\(\)/);
  assert.match(ui, /#panel:focus \{ outline:3px solid CanvasText;/);
  assert.match(ui, /#panel:focus, button:focus-visible \{ outline-color: Highlight; \}/);
});
