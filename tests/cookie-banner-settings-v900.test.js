import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const source = fs.readFileSync(new URL("../src/options/cookie-banner-settings.js", import.meta.url), "utf8");
const bootstrap = fs.readFileSync(new URL("../src/options/recovery-bootstrap.js", import.meta.url), "utf8");

test("cookie-banner Settings UX is local, live-synced, and privacy explicit", () => {
  assert.match(bootstrap, /import "\.\/cookie-banner-settings\.js";/);
  assert.match(source, /Reject cookie banners when possible/);
  assert.match(source, /<option value="off">Off<\/option>/);
  assert.match(source, /aria-live", "polite"/);
  assert.match(source, /aria-busy/);
  assert.match(source, /installOwnedOptionsStorageListener/);
  assert.match(source, /does not record banners, pages, clicks, requests, statistics, or identifiers/);
  assert.doesNotMatch(source, /localStorage|sessionStorage|indexedDB|fetch\(|sendBeacon|history\./);
});
