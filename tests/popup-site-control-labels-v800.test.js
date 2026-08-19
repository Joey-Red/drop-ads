import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/popup/popup-semantics.js", import.meta.url), "utf8");

test("popup site controls include visible site identity in accessible names", () => {
  assert.match(source, /function syncSiteControlLabels\(\)/);
  assert.match(source, /siteEnabled\?\.setAttribute\("aria-label", `Protection on \$\{site\}`\)/);
  assert.match(source, /cookieSiteEnabled\?\.setAttribute\("aria-label", `Cookie protection on \$\{site\}`\)/);
  assert.match(source, /Resume protection on \$\{site\} for this browser session/);
  assert.match(source, /Pause protection on \$\{site\} until browser restart/);
  assert.match(source, /pickElement\?\.setAttribute\("aria-label", `Pick element to block on \$\{site\}`\)/);
  assert.match(source, /siteLabelObserver\?\.disconnect\(\)/);
});
