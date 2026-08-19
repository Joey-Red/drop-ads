import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const html = fs.readFileSync(new URL("../src/popup/index.html", import.meta.url), "utf8");

test("popup site region carries stable guidance and live session status", () => {
  assert.match(html, /<section id="site-section" aria-labelledby="site-name" aria-describedby="site-help session-status" hidden>/);
  assert.match(html, /id="session-status" class="session-status" role="status" aria-live="polite" aria-atomic="true"/);
  assert.match(html, /id="site-help">Use the pause for temporary breakage\./);
});
