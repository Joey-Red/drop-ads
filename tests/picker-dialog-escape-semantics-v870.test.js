import fs from "node:fs";
import test from "node:test";
import assert from "node:assert/strict";

const ui = fs.readFileSync(new URL("../src/content/picker-ui.js", import.meta.url), "utf8");

test("picker dialog advertises its global Escape dismissal", () => {
  assert.match(ui, /id="panel" role="dialog" tabindex="-1" aria-keyshortcuts="Escape"/);
  assert.match(ui, /Keyboard: Tab to an element, then Enter\. Escape cancels\./);
  assert.match(ui, /id="cancel" type="button" aria-keyshortcuts="Escape"/);
});
