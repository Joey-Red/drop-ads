import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const html = fs.readFileSync(new URL("../src/popup/index.html", import.meta.url), "utf8");

test("popup site actions are grouped by visible site identity and feedback", () => {
  assert.match(html, /class="site-actions" role="group" aria-labelledby="site-name" aria-describedby="session-status site-help"/);
  assert.match(html, /id="pause-site"[^>]*aria-describedby="session-status site-help"/);
  assert.match(html, /id="pick-element"[^>]*aria-describedby="session-status site-help"/);
});
