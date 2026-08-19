import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const html = fs.readFileSync(new URL("../src/popup/index.html", import.meta.url), "utf8");

test("popup global controls reference the visible local-only privacy cue", () => {
  assert.match(html, /id="popup-privacy-note">Local only · no telemetry<\/span>/);
  assert.match(html, /<main id="popup-main"[^>]*aria-describedby="popup-privacy-note"/);
  assert.match(html, /id="enabled"[^>]*aria-label="Global blocking"[^>]*aria-describedby="global-status global-help engine-status popup-privacy-note"/);
  assert.match(html, /id="settings"[^>]*aria-describedby="global-status engine-status popup-privacy-note"/);
});
