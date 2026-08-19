import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const html = fs.readFileSync(new URL("../src/options/index.html", import.meta.url), "utf8");

test("Settings exposes a labelled jump navigation with stable section targets", () => {
  assert.match(html, /<nav class="settings-nav" aria-label="Settings sections">/);
  for (const id of [
    "personal-block-settings", "personal-allow-settings", "country-settings", "cosmetic-settings",
    "disabled-sites-settings", "filter-lists-settings", "cookie-settings", "backup-settings", "community-settings"
  ]) {
    assert.ok(html.includes(`href="#${id}"`), `missing navigation link for ${id}`);
    assert.ok(html.includes(`<section id="${id}"`), `missing section target ${id}`);
  }
});
