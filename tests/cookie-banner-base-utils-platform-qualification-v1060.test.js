import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const guide = fs.readFileSync(new URL("../docs/COOKIE_BANNER_BASE_UTILS_PLATFORM_QUALIFICATION.md", import.meta.url), "utf8");
const audit = fs.readFileSync(new URL("../tools/cookie-banner-utils-platform-audit.mjs", import.meta.url), "utf8");
const pkg = JSON.parse(fs.readFileSync(new URL("../package.json", import.meta.url), "utf8"));

test("M1060 guide requires exact-head Chromium and Firefox browser evidence", () => {
  assert.match(guide, /Issue #10 remains the authoritative exact-head Chromium \+ Firefox release gate/);
  assert.match(guide, /A source commit, source fingerprint, package hash\/size, or active candidate-record change invalidates the observations/);
  for (const marker of [
    "safe same-root `aria-labelledby`",
    "native submit controls",
    "96 text nodes",
    "2,000 visited nodes",
    "32 roots and four shadow levels",
    "editable ancestry/descendants",
    "disclosure/reset/native-role/busy/controlled-region/declarative-command",
    "Off"
  ]) assert.ok(guide.includes(marker), `guide missing ${marker}`);
});

test("M1060 guide is backed by the M1059 preflight audit without claiming a browser pass", () => {
  assert.match(audit, /canonical M1052-M1058 base utility platform invariants verified/);
  assert.equal(pkg.scripts["cookie-banner-utils-platform-audit"], "node tools/cookie-banner-utils-platform-audit.mjs");
  assert.ok(pkg.scripts.check.includes("npm run cookie-banner-utils-platform-audit"));
  assert.match(guide, /preflight evidence only, not a browser pass/);
});

test("M1060 keeps observation privacy explicit", () => {
  for (const marker of [
    "DOM/page/action/accessibility-name/consent text snapshots",
    "input/button state, attributes, roots, shadow-root state, or traversal state",
    "locale/language or platform profiles",
    "statistics, timestamps, identifiers, analytics, or telemetry",
    "No owned Drop Ads backend"
  ]) assert.ok(guide.includes(marker), `privacy boundary missing ${marker}`);
});
