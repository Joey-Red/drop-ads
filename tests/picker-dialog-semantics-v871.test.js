import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/content/picker-ui.js", import.meta.url), "utf8");

test("M871 picker exposes a labelled non-modal dialog, live instructions, preview, and grouped actions", () => {
  assert.match(source, /id="panel" role="dialog" tabindex="-1" aria-keyshortcuts="Escape" aria-labelledby="drop-ads-picker-title" aria-describedby="message privacy" aria-busy="false"/);
  assert.doesNotMatch(source, /aria-modal="true"/);
  assert.match(source, /id="drop-ads-picker-title">Pick an element to hide<\/strong>/);
  assert.match(source, /id="message" role="status" aria-live="polite" aria-atomic="true"/);
  assert.match(source, /id="candidate" role="region" aria-label="Selector preview"/);
  assert.match(source, /id="actions" role="group" aria-label="Picker actions"/);
  assert.match(source, /id="cancel" type="button" aria-keyshortcuts="Escape" aria-describedby="message privacy"/);
});
