import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

const html = fs.readFileSync(new URL("../src/options/index.html", import.meta.url), "utf8");

test("policy text and URL inputs disable unwanted capitalization and correction", () => {
  for (const id of [
    "block-input", "allow-input", "country-custom-tld", "cosmetic-hide-domain",
    "cosmetic-hide-selector", "cosmetic-allow-domain", "cosmetic-allow-selector",
    "subscription-url", "cookie-exception-input"
  ]) {
    const match = html.match(new RegExp(`<input[^>]*id="${id}"[^>]*>`));
    assert.ok(match, `missing ${id}`);
    assert.match(match[0], /autocomplete="off"/);
    assert.match(match[0], /autocapitalize="none"/);
    assert.match(match[0], /autocorrect="off"/);
    assert.match(match[0], /spellcheck="false"/);
  }
});
