import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const guide = fs.readFileSync(new URL("../docs/COOKIE_BANNER_SITE_QUALIFICATION.md", import.meta.url), "utf8");
const fixture = fs.readFileSync(new URL("../tools/qualification-server.mjs", import.meta.url), "utf8");
const popup = fs.readFileSync(new URL("../src/popup/index.html", import.meta.url), "utf8");

test("per-site cookie-banner qualification preserves independent blocking and exact-head evidence", () => {
  assert.match(guide, /Reject cookie banners here/);
  assert.match(guide, /Normal site protection and cookie protection must remain independently enabled/);
  assert.match(guide, /immediate and delayed\/open-shadow cookie-banner reject controls must remain untouched automatically/);
  assert.match(guide, /ordinary network\/cosmetic blocking continues/);
  assert.match(guide, /Re-enable \*\*Reject cookie banners here\*\*/);
  assert.match(guide, /both Chromium and Firefox/);
  assert.match(guide, /must not create session state, request\/page\/banner\/click history, timestamps, counters, statistics, identifiers, or telemetry/);
  assert.match(guide, /Issue #10/);
  assert.match(fixture, /Immediate cookie-banner rejection/);
  assert.match(fixture, /Delayed open-shadow cookie banner/);
  assert.match(popup, /id="cookie-banner-site-enabled"/);
});
