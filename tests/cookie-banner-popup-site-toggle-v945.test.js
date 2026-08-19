import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const html = fs.readFileSync(new URL("../src/popup/index.html", import.meta.url), "utf8");
const popup = fs.readFileSync(new URL("../src/popup/popup.js", import.meta.url), "utf8");
const boundary = fs.readFileSync(new URL("../src/core/popup-boundary.js", import.meta.url), "utf8");

test("popup exposes a separate current-site cookie-banner preference", () => {
  assert.match(html, /id="cookie-banner-site-enabled"/);
  assert.match(html, /normal blocking stays on|Keeps normal blocking on/);
  assert.match(popup, /setCookieBannerSiteDisabled\(api, currentSite, !desiredEnabled\)/);
  assert.match(popup, /state\.cookieBannerDisabledSites\.includes\(currentSite\)/);
  assert.match(popup, /state\.cookieBannerMode === "reject"/);
  assert.match(boundary, /cookieBannerMode: state\.cookieBannerMode/);
  assert.match(boundary, /cookieBannerDisabledSites: Object\.freeze\(cookieBannerDisabledSites\)/);
});
