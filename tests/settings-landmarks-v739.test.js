import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const html = fs.readFileSync(new URL("../src/options/index.html", import.meta.url), "utf8");

test("Settings main and major sections expose stable accessible names", () => {
  assert.match(html, /<main id="settings-main" aria-labelledby="settings-title">/);
  assert.match(html, /<h1 id="settings-title">drop-ads<\/h1>/);
  for (const id of [
    "personal-block-heading",
    "personal-allow-heading",
    "country-heading",
    "cosmetic-heading",
    "disabled-sites-heading",
    "filter-lists-heading",
    "cookie-heading",
    "backup-heading",
    "community-heading"
  ]) {
    assert.match(html, new RegExp(`aria-labelledby="${id}"`));
    assert.match(html, new RegExp(`<h2 id="${id}">`));
  }
});

test("dynamic Settings lists have stable accessible labels", () => {
  for (const label of [
    "Personal block rules",
    "Personal allow rules",
    "Blocked country or region TLD rules",
    "Personal cosmetic hide rules",
    "Personal cosmetic allow rules",
    "Sites with persistent protection disabled",
    "Configured filter lists",
    "Cookie protection exceptions"
  ]) assert.match(html, new RegExp(`aria-label="${label}"`));
});
