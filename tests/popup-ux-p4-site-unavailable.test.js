import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const html = fs.readFileSync(new URL("../src/popup/index.html", import.meta.url), "utf8");
const source = fs.readFileSync(new URL("../src/popup/popup.js", import.meta.url), "utf8");

test("Popup UX P4 explains why site controls may be absent with an accessible status", () => {
  assert.match(
    html,
    /<p id="site-unavailable" class="site-unavailable" role="status" aria-live="polite" aria-atomic="true" hidden>Site controls are available on HTTP\(S\) pages\.<\/p>/
  );
});

test("Popup UX P4 hides guidance only after a validated HTTP(S) active tab resolves", () => {
  assert.match(source, /const siteUnavailable = document\.querySelector\("#site-unavailable"\)/);

  const validation = source.indexOf('if (tab && /^https?:\\/\\//i.test(tab.url)) {');
  const normalization = source.indexOf("currentSite = normalizeDomain(tab.url);", validation);
  const hideUnavailable = source.indexOf("siteUnavailable.hidden = true;", normalization);

  assert.ok(validation >= 0, "HTTP(S) active-tab validation must remain explicit");
  assert.ok(normalization > validation, "site normalization must follow HTTP(S) validation");
  assert.ok(hideUnavailable > normalization, "unavailable status must hide only after validated site normalization");
});

test("Popup UX P4 active-tab failures retain generic guidance and hidden site controls", () => {
  assert.match(source, /catch \{[\s\S]*?siteSection\.hidden = true;[\s\S]*?siteUnavailable\.hidden = false;[\s\S]*?\}/);
});
