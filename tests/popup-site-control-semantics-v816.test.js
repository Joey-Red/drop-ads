import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const source = fs.readFileSync(new URL("../src/popup/popup-semantics.js", import.meta.url), "utf8");

test("site-specific popup controls expose identity, pressed state, and teardown", () => {
  assert.match(source, /pauseSite\.setAttribute\("aria-pressed", paused \? "true" : "false"\)/);
  assert.match(source, /siteEnabled\?\.setAttribute\("aria-label", `Protection on \$\{site\}`\)/);
  assert.match(source, /cookieSiteEnabled\?\.setAttribute\("aria-label", `Cookie protection on \$\{site\}`\)/);
  assert.match(source, /Pause protection on \$\{site\} until browser restart/);
  assert.match(source, /Pick element to block on \$\{site\}/);
  assert.match(source, /window\.addEventListener\("pagehide"/);
  assert.match(source, /siteLabelObserver\?\.disconnect\(\)/);
});
