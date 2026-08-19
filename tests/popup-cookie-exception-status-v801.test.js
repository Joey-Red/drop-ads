import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/popup/popup-semantics.js", import.meta.url), "utf8");

test("popup explains a local per-site cookie exception when it is the active recovery state", () => {
  assert.match(source, /cookieSiteRow && !cookieSiteRow\.hidden && cookieSiteEnabled && !cookieSiteEnabled\.checked/);
  assert.match(source, /Cookie protection is disabled for this site by a local exception\./);
  const cookieIndex = source.indexOf("Cookie protection is disabled for this site by a local exception.");
  assert.ok(source.indexOf("Protection is disabled for this site until you turn it back on.") < cookieIndex);
  assert.ok(source.indexOf("Protection is paused for this browser session only.") < cookieIndex);
  assert.ok(source.indexOf("Global blocking is off;") < cookieIndex);
  assert.match(source, /\[enabled, siteEnabled, cookieSiteEnabled, pauseSite\]/);
});
