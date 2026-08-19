import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const html = fs.readFileSync(new URL("../src/popup/index.html", import.meta.url), "utf8");
const source = fs.readFileSync(new URL("../src/popup/popup.js", import.meta.url), "utf8");

test("M454 global popup status remains outside the hidden site region and atomic polite", () => {
  const globalStatusIndex = html.indexOf('id="global-status"');
  const siteSectionIndex = html.indexOf('id="site-section"');
  assert.ok(globalStatusIndex >= 0);
  assert.ok(siteSectionIndex >= 0);
  assert.ok(globalStatusIndex < siteSectionIndex);
  assert.match(html, /id="global-status"[^>]*role="status"[^>]*aria-live="polite"[^>]*aria-atomic="true"/);
});

test("M454 global and site-local feedback route through separate publication helpers", () => {
  assert.match(source, /function publishGlobalStatus\(text\)[\s\S]*?globalStatus\.textContent = text/);
  assert.match(source, /function publishSiteStatus\(text\)[\s\S]*?sessionStatus\.textContent = text/);
  assert.match(source, /publishGlobalStatus\("Applying protection change…"\)/);
  assert.match(source, /publishGlobalStatus\(popupCaughtErrorMessage\(error, "Live popup updates are unavailable"\)\)/);
  assert.match(source, /publishGlobalStatus\(popupCaughtErrorMessage\(error, "Could not open Settings"\)\)/);
  assert.match(source, /publishSiteStatus\("Applying site protection…"\)/);
  assert.match(source, /publishSiteStatus\(sessionPaused \? "Resuming protection…" : "Pausing protection…"\)/);
  assert.match(source, /publishSiteStatus\("Applying cookie protection…"\)/);
  assert.match(source, /publishSiteStatus\("Starting element picker…"\)/);
});
