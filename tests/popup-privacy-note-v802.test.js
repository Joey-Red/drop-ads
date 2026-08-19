import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const html = fs.readFileSync(new URL("../src/popup/index.html", import.meta.url), "utf8");

test("popup main landmark exposes the visible privacy boundary", () => {
  assert.match(html, /id="popup-main" aria-labelledby="popup-title" aria-describedby="popup-privacy-note" aria-busy="false"/);
  assert.match(html, /id="popup-privacy-note">Local only · no telemetry<\/span>/);
  assert.doesNotMatch(html, /analytics|tracking identifier|usage statistics/i);
});
