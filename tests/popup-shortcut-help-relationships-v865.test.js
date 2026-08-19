import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const html = fs.readFileSync(new URL("../src/popup/index.html", import.meta.url), "utf8");

test("shortcut disclosure and list share visible availability guidance", () => {
  assert.match(html, /<details id="shortcut-help" class="shortcut-help" aria-labelledby="shortcut-help-summary">/);
  assert.match(html, /id="shortcut-help-summary"[^>]*aria-controls="shortcut-help-list"[^>]*aria-describedby="shortcut-help-note"/);
  assert.match(html, /id="shortcut-help-list"[^>]*aria-describedby="shortcut-help-note"/);
  assert.match(html, /Unavailable shortcuts are marked below\. Site shortcuts require an HTTP\(S\) page/);
  assert.doesNotMatch(html, /Unavailable commands are omitted/);
});
