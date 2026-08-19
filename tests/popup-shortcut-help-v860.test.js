import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const html = fs.readFileSync(new URL("../src/popup/index.html", import.meta.url), "utf8");

test("M860 exposes discoverable page-local popup keyboard help", () => {
  assert.match(html, /<details id="shortcut-help" class="shortcut-help"[^>]*>/);
  assert.match(html, /<summary id="shortcut-help-summary"[^>]*aria-keyshortcuts="\?"[^>]*>Keyboard shortcuts<\/summary>/);
  for (const key of ["G", "S", "P", "C", "E", "O"]) assert.match(html, new RegExp(`<kbd>${key}</kbd>`));
  assert.match(html, /Unavailable shortcuts are marked below\./);
  assert.match(html, /Site shortcuts require an HTTP\(S\) page/);
  assert.match(html, /id="shortcut-help-list"/);
});
