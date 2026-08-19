import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const html = fs.readFileSync(new URL("../src/popup/index.html", import.meta.url), "utf8");
const script = fs.readFileSync(new URL("../src/popup/popup.js", import.meta.url), "utf8");

test("M450 popup provides an accessible explanation for unavailable site controls", () => {
  assert.match(
    html,
    /<p id="site-unavailable" class="site-unavailable" role="status" aria-live="polite" aria-atomic="true" hidden>Site controls are available on HTTP\(S\) pages\.<\/p>/
  );
  assert.match(html, /<section id="site-section"[^>]*hidden>/);
});

test("M450 only a validated HTTP(S) active tab hides the unavailable note", () => {
  assert.match(script, /const siteUnavailable = document\.querySelector\("#site-unavailable"\);/);

  const validation = script.indexOf('if (tab && /^https?:\\/\\//i.test(tab.url)) {');
  const normalization = script.indexOf("currentSite = normalizeDomain(tab.url);", validation);
  const hideUnavailable = script.indexOf("siteUnavailable.hidden = true;", normalization);
  assert.ok(validation >= 0, "HTTP(S) active-tab validation must remain explicit");
  assert.ok(normalization > validation, "site normalization must follow HTTP(S) validation");
  assert.ok(hideUnavailable > normalization, "unavailable status must hide only after validated site normalization");

  assert.match(script, /catch \{[\s\S]*?siteSection\.hidden = true;[\s\S]*?siteUnavailable\.hidden = false;[\s\S]*?\}/);
});
